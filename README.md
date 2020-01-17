# MassScout Data Entry Extension

[![Build Status](https://travis-ci.com/broad-well/massscout-extension.svg?branch=master)](https://travis-ci.com/broad-well/massscout-extension)

Browser extension that facilitates performance data entry for the MassScout Alliance.

## Why a Browser Extension?

For scouting data entry, we have the following unique circumstances to consider:
* Competition venues often do not have Internet access
* Team members might have Windows laptops, MacBooks, or Chromebooks
* We must be able to store previous match data within each member's computer for the duration of the event

Because venues often do not have Internet access, we cannot host the data entry solution online. Since team members might have Chromebooks, a cross-platform discrete GUI application would not be optimal. Since offline functionality on Chromebooks is limited to Chrome apps and Chrome extensions, and since Chrome apps are being deprecated soon, a browser extension is our only option left. Such a medium ensures that everyone can collect scouting data electronically at any time.

## Project Structure

* src/typescript: TypeScript source files
* src/assets: static files
* dist: Chrome Extension directory
* dist/js: Generated JavaScript files

## Setup

```
npm install
```

## Import as Visual Studio Code project

...

## Build

```
npm run build
```

## Build in watch mode

### terminal

```
npm run watch
```

### Visual Studio Code

Run watch mode.

type `Ctrl + Shift + B`

## Load extension to chrome

Load `dist` directory

## Test
`npx jest` or `npm run test`
