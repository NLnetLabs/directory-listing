import styles from './styles.css?raw'

/**
 * Generate index.html file content with the given options.
 *
 * @param {String} path
 * @param {Array<{path: String, isDirectory: Boolean, size: Number, modifiedAt: Date}>} list
 * @param {{footerContent?: String, projectName: String}} [opts]
 * @returns {string}
 */
export default function generate(path, list, opts) {
  const projectName = (opts && opts.projectName) ? opts.projectName : "";
  const indexOf = '/' + path.replace(/\.+/, '')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="robots" content="nofollow,noarchive,noindex">
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${projectName} nightly builds</title>
  <style>${'\n' + styles}</style>
</head>
<body>
<header>
  <h1>${projectName} nightly builds</h1>
  <p>These are the nightly builds of ${projectName}. 
  They are built from the <code>main</code> branch every time the <code>main</code> branch is updated.</p>
  <p>These builds are provided as-is and are not supported; use at your own risk.</p>
</header>
<svg xmlns="http://www.w3.org/2000/svg" style="display: none">
  <defs>
    <symbol id="dir" viewBox="0 0 24 24" fill="currentColor">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M9 3a1 1 0 0 1 .608 .206l.1 .087l2.706 2.707h6.586a3 3 0 0 1 2.995 2.824l.005 .176v8a3 3 0 0 1
        -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-11a3 3 0 0 1 2.824 -2.995l.176 -.005h4z"/>
    </symbol>
    <symbol id="file" viewBox="0 0 24 24" fill="currentColor">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M12 2l.117 .007a1 1 0 0 1 .876 .876l.007 .117v4l.005 .15a2 2 0 0 0 1.838 1.844l.157 .006h4l.117
        .007a1 1 0 0 1 .876 .876l.007 .117v9a3 3 0 0 1 -2.824 2.995l-.176 .005h-10a3 3 0 0 1 -2.995 -2.824l-.005
        -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005h5z"/>
      <path d="M19 7h-4l-.001 -4.001z"/>
    </symbol>
  </defs>
</svg>
<main>
  <table>
    <thead>
      <tr>
        <th class="name">Name</th>
        <th class="size">Size</th>
        <th class="mod-date">Last Modified</th>
      </tr>
    </thead>
    <tbody>
      ${
        ['.', '/', './'].includes(path)
          ? ''
          : `
        <tr>
          <td class="name">
            <svg class="icon" xmlns="http://www.w3.org/2000/svg">
              <use href="#dir"/>
            </svg>
            <a href="..">..</a>
          </td>
          <td class="size">-</td>
          <td class="mod-date">-</td>
        </tr>
`
      }
      ${list
        .map(
          (item) => `
        <tr>
          <td class="name">
            <svg class="icon" xmlns="http://www.w3.org/2000/svg">
              <use href="#${item.isDirectory ? 'dir' : 'file'}"/>
            </svg>
            <a href="./${item.path}">${item.path}</a>
          </td>
          <td class="size" title="${item.size}">${humanizeBytes(item.size)}</td>
          <td class="mod-date">${formatDate(item.modifiedAt)}</td>
        </tr>`
        )
        .join('\n')}
    </tbody>
  </table>
</main>
${opts && opts.footerContent && `<footer>${opts.footerContent}</footer>`}
</body>
</html>
`
}

/**
 * Convert bytes to human-readable format.
 *
 * @param {Number} n
 * @returns {String}
 */
function humanizeBytes(n) {
  if (n === 0) {
    return '0 B'
  }

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(n) / Math.log(1024))

  return parseFloat((n / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Convert a Date into yyyy-mm-dd HH:mm:ss
 * 
 * @param {Date} date 
 * @returns {String}
 */
function formatDate(date) {
  return date.getUTCFullYear().toString().padStart(4, "0") + "-" + 
    date.getUTCMonth().toString().padStart(2, "0") + "-" +
    date.getUTCDay().toString().padStart(2, "0") + " " + 
    date.getUTCHours().toString().padStart(2, "0") + ":" +
    date.getUTCMinutes().toString().padStart(2, "0") + ":" +
    date.getUTCSeconds().toString().padStart(2, "0");
}
