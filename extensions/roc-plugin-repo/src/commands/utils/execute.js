// A minimal version of execute existing in roc

import { exec } from 'child_process';

export default function(command) {
  return new Promise((resolve, reject) => {
    let exitCode = 0;
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        error.exitCode = exitCode; // eslint-disable-line no-param-reassign
        error.stderr = stderr; // eslint-disable-line no-param-reassign
        error.stdout = stdout; // eslint-disable-line no-param-reassign
        return reject(error); // eslint-disable-line no-param-reassign
      }

      return resolve({
        exitCode,
        stdout,
        stderr,
      });
    });

    child.on('exit', code => {
      exitCode = code;
    });
  });
}
