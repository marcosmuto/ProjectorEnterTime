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
        
    await EnterTime(driver);
    
    //await driver.quit();
    Log('Done');
  } catch (error) {
    Log(error);
  }
}

async function Login(driver) {
  Log('Login into Projector');
  await driver.get('https://app.projectorpsa.com/logon');
  await driver.getTitle();
  
  let userNameBox = await driver.findElement(By.name('UserName'));
  let passwordBox = await driver.findElement(By.name('Password'));
  let logonButton = await driver.findElement(By.id('log_on_button'));

  await userNameBox.sendKeys(process.env.PROJECTOR_USER);
  await passwordBox.sendKeys(process.env.PROJECTOR_PWD);
  await logonButton.click();
}

async function EnterTime(driver) {
  let url = 'https://app3.projectorpsa.com/timesheet';
  //let url = 'C:/Users/MarcosMuto/Downloads/Time_Entry_Projector.html';
  Log('Accessing timesheet url:' + url);
  await driver.get(url);
      
  // Find the time table identified by Top Level
  let timeTable = await driver.wait(until.elementLocated(By.id('topLevel')), 30000);

}

async function buttonAvailable(driver, buttonName) {
  let saveButton = await driver.findElement(By.id(buttonName));

  let buttonEnabled = await saveButton.getAttribute('disabled');

  return buttonEnabled != 'disabled';
}

async function SaveTimesheet(driver) {
  Log('Saving Timesheet');
  
  await driver.wait(() => buttonAvailable(driver, 'save_all'), 10000);
  
  let saveButton = await driver.findElement(By.id('save_all'));
  await saveButton.click();

  //let buttonEnabled = await saveButton.getAttribute('disabled');
  //if (buttonEnabled != 'disabled') {
  //  await saveButton.click();
  //}

}

async function SubmitTimesheet(driver) {
  Log('Submitting Timesheet');

  await driver.wait(() => buttonAvailable(driver, 'submit_all'), 10000);

  let submitButton = await driver.findElement(By.id('submit_all'));
  console.log(submitButton);
  //await submitButton.click();

  //let buttonEnabled = await submitButton.getAttribute('disabled');
  //if (buttonEnabled != 'disabled') {
  //  await submitButton.click();
  //}

}

Main();