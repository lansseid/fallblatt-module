const vorpal = require('vorpal')();
const colors = require('colors');
const fs = require('fs');
const SerialPort = require('serialport');

module.exports = class UARTController {
  constructor() {
    UARTController.connect();
  }

  static status() {
    return this.isConnected;
  }

  static connect() {
    if (this.isConnecting) return;

    this.commandList = [];
    this.isConnecting = true;

    let config = require('../config/config.json');

    this.connectionPromise = new Promise((resolve, reject) => {
      this.port = new SerialPort(config.serial, {
        baudRate: 19200
      }, function (err) {
        if (err) {
          vorpal.log(colors.red(err.message));
        } else {
          vorpal.log(colors.green('serial is connected'));
        }

        resolve();
      });

      this.isConnected = true;

      setInterval(() => {
        if (this.commandList.length > 0 && this.isConnected) {
          let command = this.commandList.shift();

          UARTController.break().then(() => {
            UARTController.port.write(command, function (err) { });
          });
        }
      }, 500)
    });
  }

  static break() {
    return new Promise((resolve, reject) => {
      UARTController.port.set({brk: true}, () => {
        setTimeout(() => {
          UARTController.port.set({brk: false}, () => {
            resolve();
          });
        }, 50);
      });
    });
  }

  static send(data) {
    this.commandList.push(data);
  }
};
