import fs from 'fs';
import path from 'path';
import { networkInterfaces } from 'os';
import dotenv from 'dotenv';
import chalk from 'chalk';
// import execa from 'execa';

export const isFunction = (arg: unknown): arg is (...args: any[]) => any =>
  typeof arg === 'function';
export const isRegExp = (arg: unknown): arg is RegExp =>
  Object.prototype.toString.call(arg) === '[object RegExp]';

/*
 * Read all files in the specified folder, filter through regular rules, and return file path array
 * @param root Specify the folder path
 * [@param] reg Regular expression for filtering files, optional parameters
 * Note: It can also be deformed to check whether the file path conforms to regular rules. The path can be a folder or a file. The path that does not exist is also fault-tolerant.
 */
export function readAllFile(root: string, reg: RegExp) {
  let resultArr: string[] = [];
  try {
    if (fs.existsSync(root)) {
      const stat = fs.lstatSync(root);
      if (stat.isDirectory()) {
        // dir
        const files = fs.readdirSync(root);
        files.forEach(function (file) {
          const t = readAllFile(root + '/' + file, reg);
          resultArr = resultArr.concat(t);
        });
      } else {
        if (reg !== undefined) {
          if (isFunction(reg.test) && reg.test(root)) {
            resultArr.push(root);
          }
        } else {
          resultArr.push(root);
        }
      }
    }
  } catch (error) {}

  return resultArr;
}

export function getIPAddress() {
  let interfaces = networkInterfaces();
  for (let devName in interfaces) {
    let iFace = interfaces[devName];
    if (!iFace) return;
    for (let i = 0; i < iFace.length; i++) {
      let alias = iFace[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }

  return '';
}

export function isDevFn(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProdFn(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isReportMode(): boolean {
  return process.env.REPORT === 'true';
}

export interface ViteEnv {
  VITE_PORT: number;
  VITE_USE_MOCK: boolean;
  VITE_PUBLIC_PATH: string;
  VITE_PROXY: [string, string][];
  VITE_GLOB_APP_TITLE: string;
  VITE_USE_CDN: boolean;
}

export function loadEnv(): ViteEnv {
  const env = process.env.NODE_ENV;
  const ret: any = {};
  const envList = [`.env.${env}.local`, `.env.${env}`, '.env.local', '.env', ,];
  envList.forEach((e) => {
    dotenv.config({
      path: e,
    });
  });

  for (const envName of Object.keys(process.env)) {
    let realName = (process.env as any)[envName].replace(/\\n/g, '\n');
    realName = realName === 'true' ? true : realName === 'false' ? false : realName;
    if (envName === 'VITE_PORT') {
      realName = Number(realName);
    }
    if (envName === 'VITE_PROXY') {
      try {
        realName = JSON.parse(realName);
      } catch (error) {}
    }
    ret[envName] = realName;
    process.env[envName] = realName;
  }
  return ret;
}

export function getEnvConfig(match = 'VITE_GLOB_', confFiles = ['.env', '.env.production']) {
  let envConfig = {};
  confFiles.forEach((item) => {
    try {
      const env = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), item)));

      envConfig = { ...envConfig, ...env };
    } catch (error) {}
  });
  Object.keys(envConfig).forEach((key) => {
    const reg = new RegExp(`^(${match})`);
    if (!reg.test(key)) {
      Reflect.deleteProperty(envConfig, key);
    }
  });
  return envConfig;
}

function consoleFn(color: string, message: any) {
  console.log(
    chalk.blue.bold('****************  ') +
      (chalk as any)[color].bold(message) +
      chalk.blue.bold('  ****************')
  );
}

export function successConsole(message: any) {
  consoleFn('green', '✨ ' + message);
}

export function errorConsole(message: any) {
  consoleFn('red', '✨ ' + message);
}

export function warnConsole(message: any) {
  consoleFn('yellow', '✨ ' + message);
}

export function getCwdPath(...dir: string[]) {
  return path.resolve(process.cwd(), ...dir);
}

// export const run = (bin: string, args: any, opts = {}) =>
//   execa(bin, args, { stdio: 'inherit', ...opts });
