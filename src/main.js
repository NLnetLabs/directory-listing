import { getBooleanInput, getInput, getMultilineInput, setFailed, info, setOutput } from '@actions/core'
import { glob } from 'glob'
import { join } from 'node:path'
import { existsSync, statSync, writeFileSync } from 'node:fs'
import { default as generate } from './template.js'

const input = {
  target: getInput('target'),
  ignore: getMultilineInput('ignore')
    .map((s) => s.split(','))
    .flat()
    .map((s) => s.trim())
    .filter(Boolean),
  showHidden: getBooleanInput('show-hidden'),
  overwrite: getBooleanInput('overwrite'),
  footer: getInput('footer'),
  project: getInput('project'),
}

;(async () => {
  /** @type {Array<String>} */
  const dirs = (
    await glob(join(input.target, '**'), {
      absolute: false,
      mark: true, // add a `/` character to directory matches
      ignore: input.ignore,
      dot: input.showHidden,
    })
  )
    .filter((path) => !path.includes(join(input.target, '.git') + '/')) // always ignore `.git` directory
    .filter((path) => path.endsWith('/')) // leave only directories
    .map((path) => path.slice(0, -1)) // remove the trailing `/` (added by `mark: true`)
    .filter(Boolean) // remove empty strings (if any)

  /** @type {Map<String, Array<{path: String, isDirectory: Boolean, size: Number, modifiedAt: Date}>>} */
  const list = new Map(
    await Promise.all(
      dirs.map(async (dir) => [
        dir,
        await Promise.all(
          (
            await glob('*', {
              absolute: false,
              mark: true,
              ignore: input.ignore,
              dot: input.showHidden,
              cwd: dir,
            })
          )
            .filter((path) => !path.includes(join(dir, '.git') + '/')) // always ignore `.git` directory
            .sort((a, b) => {
              const [aIsDir, bIsDir] = [a.endsWith('/'), b.endsWith('/')]

              switch (true) {
                case aIsDir && !bIsDir:
                  return -1 // directories first
                case !aIsDir && bIsDir:
                  return 1 // files after directories
                default:
                  a.localeCompare(b, undefined, {numeric: true, sensitivity: 'base'}) // alphabetical order
              }
            })
            .map(async (path) => {
              return {
                path: path.endsWith('/') ? path.slice(0, -1) : path,
                isDirectory: path.endsWith('/'),
                size: (
                  await glob('**', {
                    absolute: true,
                    cwd: join(dir, path),
                  })
                ).reduce((acc, p) => {
                  const stat = statSync(p)

                  return stat.isDirectory() ? acc : acc + stat.size // ignore directories and sum file sizes
                }, 0),
                modifiedAt: new Date(statSync(join(dir, path)).mtimeMs),
              }
            })
        ),
      ])
    )
  )

  const [generated, skipped] = [[], []]

  list.forEach((files, dir) => {
    if (files.length) {
      const path = join(dir, 'index.html')

      if (input.overwrite || !existsSync(path)) {
        let sortedFiles = files.toSorted((a, b) => {
          if (a.isDirectory && !b.isDirectory) {
            return -1;
          } else if (!a.isDirectory && b.isDirectory) {
            return 1;
          }
          return a.path.localeCompare(b.path, undefined, {numeric: true, sensitivity: 'base'});
        });
        writeFileSync(path, generate(dir, sortedFiles, {footerContent: input.footer, projectName: input.project}), { flush: true })
        generated.push(path)
      } else {
        skipped.push(path)
      }
    }
  })

  info(
    `Generated ${generated.length} index.html files: ${generated.join(', ')}${
      skipped.length ? ` (skipped ${skipped.length}: ${skipped.join(', ')})` : ''
    }`
  )

  setOutput('generated', generated)
})().catch(setFailed)
