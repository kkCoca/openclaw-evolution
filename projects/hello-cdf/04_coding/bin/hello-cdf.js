#!/usr/bin/env node
const { hello } = require('../src');

const args = process.argv.slice(2);
let name = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--name' || args[i] === '-n') {
    name = args[i + 1];
    break;
  }
  if (args[i] === '--help' || args[i] === '-h') {
    console.log('Usage: hello-cdf [--name <名字>] [--help] [--version]');
    console.log('');
    console.log('Options:');
    console.log('  --name, -n     自定义名字 (默认：CDF)');
    console.log('  --help, -h     显示帮助信息');
    console.log('  --version, -v  显示版本号');
    process.exit(0);
  }
  if (args[i] === '--version' || args[i] === '-v') {
    console.log('hello-cdf v1.0.0');
    process.exit(0);
  }
}

console.log(hello(name));
