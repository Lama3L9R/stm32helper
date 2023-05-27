# STM32Helper
[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)
[![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

As its name, this is a tool for stm32 development with vscode and WSL.
---

# Features

1. [x] Generate `c_cpp_properties.json`
2. [x] WGenerate the value of Makefile 'C_SOURCES'
3. [ ] Setup workspace in `Windows`

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

You have to edit your Makefile first!

Add this line below `C_SOURCES`

```
C_SOURCES += $(shell stm32helper searchc .) # Add all user source code
```

And you will get something like this:

```
######################################
# source
######################################
# C sources
C_SOURCES =  \
Core/Src/main.c \
Core/Src/stm32g0xx_it.c \
Core/Src/stm32g0xx_hal_msp.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_i2c.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_i2c_ex.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_rcc.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_rcc_ex.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_ll_rcc.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_flash.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_flash_ex.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_gpio.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_dma.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_dma_ex.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_ll_dma.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_pwr.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_pwr_ex.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_cortex.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_exti.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_tim.c \
Drivers/STM32G0xx_HAL_Driver/Src/stm32g0xx_hal_tim_ex.c \
Core/Src/system_stm32g0xx.c

C_SOURCES += $(shell stm32helper searchc .) # Add all user source code
```

## Download SVD

`$ stm32helper svd -d <Your MCU Name> [-o <Output file>] [-s <SVD Index source>] [-u <SVD Download Source>]`

For example

My MCU is `STM32G071GBU6` so the command will be like: `node index.js svd -d STM32G071GB`


## Using in Windows

Things are a bit complicated in Windows so the easiest way is to use it in WSL (run `code` command in WSL). However, It is still possible. 

Also please checkout this issue: https://github.com/microsoft/vscode-cpptools/issues/11018

1. Create some batch file like these:
```
@echo off
wsl arm-none-eabi-gcc %*
```
2. Copy out `ALL` system headers (something like: `/usr/arm-none-eabi/include`)
3. Set `C_Cpp.default.systemIncludePath` to where you've copied out
4. Change `compilerPath` to your batch file

Not going to say too much about this method since its a sh1t. After C++ extension fixed that bug I'll make this whole process full automatic
