require('dotenv').config();

const {Builder, By, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

function Log(message) {
  console.log(new Date().toUTCString() + ' ' + message);
}

async function Main() {
  try {
    Log('Initiating');
    let options = new chrome.Options();
    options.addArguments("--window-size=1366,768");
    let driver = await new Builder()
      .setChromeOptions(options)
      .forBrowser('chrome')
      .build();

    //setting 10 seconds of page element find timeout
    await driver.manage().setTimeouts({implicit: 10000});
    
    await Login(driver);
    
    //await driver.quit();
    Log('Done');
  } catch (error) {
    Log(error);
  }
}

async function Login(driver) {
  Log('Login into Projector');
  await driver.get('https://outlook.office.com/mail/');
  await driver.getTitle();
  
}

Main();