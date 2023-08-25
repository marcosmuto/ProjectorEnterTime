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
    
    await SaveTimesheet(driver);

    try {
      await SubmitTimesheet(driver);
    } catch {
      // the save button reloads some elements of the DOM
      // this can throw a StaleElementReferenceError exception
      // meaning the submit button is not in the DOM anymore
      // in this case, we can try to get the submit button and click again
      await SubmitTimesheet(driver);
    }
    
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

  let tableRows = await timeTable.findElements(By.xpath('*'));

  //let lookupProject = 'Regeneron - IOPS - Nautilus Development - 2021 - 2Q2022';
  let lookupProject = process.env.PROJECT;
  Log('Project to enter data: ' + lookupProject);

  for (let row of tableRows) {
    let rowTagName = await row.getTagName();

    // Pull the project links that have the project names on the link text
    let links = await row.findElements(By.className('project_info'));
    
    if (links.length > 0) {
      let projectName = await links[0].getText();

      Log('Row Tag: [' + rowTagName + '] with project: [' + projectName + ']');

      if (projectName == lookupProject) {
        // Get the input elements to enter the hours
        //let hourFields = await row.findElements(By.xpath('//input[@data-id="total_cell"]'));
        let hourFields = await row.findElements(By.className('total_cell_hours'));

        //Project without sub tasks
        if (await hourFields[0].getTagName() == "input") {
          await EnterTimeOnInput(hourFields);
        }
        //Project with sub tasks
        else {
          let tasks = await row.findElements(By.className('item'))
          for (let task of tasks) {
            if (await task.getTagName() == "li") {
              let taskLink = await task.findElement(By.className('task_info'));
              let taskName = await taskLink.getText();

              Log('Task Name: [' + taskName + ']');
              
              if (taskName == process.env.PROJECT_TASK) {
                let taskHourFields = await task.findElements(By.className('total_cell_hours'));
                await EnterTimeOnInput(taskHourFields);
              }
            }
          }
        }
        
      }
      
    }
  }
  Log('All time entered');
}

async function EnterTimeOnInput(hourFields) {

  // safeguard to stop the task input element loop
  inputIndex = 0

  for (let input of hourFields) {
    let parentDiv = await input.findElements(By.xpath('.//..'));
    let parentClass = await parentDiv[0].getAttribute('class');
      
    if (!parentClass.includes('nwd')) { //nwd - Not Working Day, don't enter hours
      let currentInputDate = await input.getAttribute('data-date')
      let currentInputDateMilSec = Date.parse(currentInputDate);

      if (!isNaN(currentInputDateMilSec) && currentInputDateMilSec < Date.now()) { // don't enter hour in the future

        let currentInputValue = await input.getAttribute('value');
        if (!currentInputValue) {
          await input.sendKeys('8');
        } else {
          Log('Input with date: ' + currentInputDate + ' already have a value ' + currentInputValue + ' skiping');
        }
                
      }
    }
    
    inputIndex++;
    if (inputIndex >= 6) break; //wont work more than 6 days a week, hopefully
  }  

}

async function buttonAvailable(driver, buttonName) {
  let button = await driver.findElement(By.id(buttonName));

  let buttonEnabled = await button.getAttribute('disabled');

  Log(buttonName + ' - ' + buttonEnabled);

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
  await submitButton.click();

  //let buttonEnabled = await submitButton.getAttribute('disabled');
  //if (buttonEnabled != 'disabled') {
  //  await submitButton.click();
  //}

}

Main();