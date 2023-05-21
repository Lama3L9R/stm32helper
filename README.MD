# STM32Helper
[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

As its name, this is a tool for stm32 development with vscode.
---

# Features

1. [x] Generate `c_cpp_properties.json`
2. [ ] WIP: Generate the value of Makefile 'C_SOURCES'

# How to use

## Pre-Requirements

Install `nodejs` and `yarn`, then run
`$ yarn install && npm install -g .`


## Setup JLink workspace

**Good news! From now on no more stdout redirect is needed! You can generate `c_cpp_properties.json`, Cortex Debug profile and build tasks in one step!!**

**Good news x2 ! From now on you can install this script globally so you can access this script at anywhere!**
```
$ stm32helper vscode /path/to/your/project --jlink-all
```

Although most of the steps are full automatic now but you still need to set `cortex-debug.JLinkGDBServerPath` and `cortex-debug.gdbPath` in `settings.json` manully

~~Replace `/path/to/your/project` to your project directory path, then run~~
~~`$ node index.js vscode /path/to/your/project >> /path/to/your/project/.vscode/c_cpp_properties.json`~~

## Generate `C_SOURCES`

**COMING SOON**

## Download SVD

`$node index.js svd -d <Your MCU Name> [-o <Output file>] [-s <SVD Index source>] [-u <SVD Download Source>]`

For example

My MCU is `STM32G071GBU6` so the command will be like: `node index.js svd -d STM32G071GB`