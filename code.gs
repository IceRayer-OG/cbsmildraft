/** @OnlyCurrentDoc */

// Confirm the pick
function confirmPick() {
  // Check the status of the draft
  if(!checkDraftStarted()){
    showAlert("Error!", "Draft has not started! Come back later.");
    Logger.log("Draft not started error displayed");
    return;
  }

  if(!checkConfirmAllowed()){
    showAlert("Please select a player", "If you received this in error contact support");
    return;
  }
  
  setPicks();
  Logger.log("Confirmation Pressed");

  if(checkSendEmail()){
    sendEmail();
    Logger.log('Email Sent!');
    showAlert("Congratulations", "Pick submitted and email sent");
  } else {
    Logger.log('No Email Sent!');
    showAlert("Congratulations", "Pick submitted and please email league");
  }

}

function showAlert(title, message) {
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.  Choose the appropriate one.
      .alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK); // You can customize the button set.
}

function checkDraftStarted() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName("Settings");
  var draftStarted = settingsSheet.getRange('B1').getValue();
  return draftStarted;
}

function checkSendEmail() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName("Settings");
  if(settingsSheet.getRange('B12').getValue() === true){
    return true;
  } 
  return false;
}

function checkConfirmAllowed() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName("Settings");
  var confirmations = settingsSheet.getRange('B16').getValue();
  var currentNumePicks = settingsSheet.getRange('B15').getValue();

  if(confirmations < currentNumePicks){
    confirmations++;
    settingsSheet.getRange('B16').setValue(confirmations);
    return true;
  }else{
    return false;
  }
}

// Check to see if the current pick from the on the clock selection
function isPickAllowed(pickEdited){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var selectionSheet = ss.getSheetByName("CBS Mil Draft");
  var [pickOTC,pickOnDeck] = getPickInfo();
  // Only allow the OTC and OnDeck picks to be selected
  if(pickEdited === pickOTC){
    return true;
  } else if(pickEdited === pickOnDeck && hasCountdownElapsed()) {
    return true;
  }
  return false;
}

function hasCountdownElapsed(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName("Settings");
  var countdownElapsed = settingsSheet.getRange('B2').getValue();
  return countdownElapsed;
}

function getPickInfo(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var selectionSheet = ss.getSheetByName("CBS Mil Draft");
  var pickOTC = selectionSheet.getRange('G6').getValue();
  var pickOnDeck = selectionSheet.getRange('G13').getValue();
  return [pickOTC, pickOnDeck];
}

function setPicks() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var selectionSheet = ss.getSheetByName("CBS Mil Draft");
  var settingsSheet = ss.getSheetByName('Settings');
  var totalPicks = settingsSheet.getRange('B9').getValue();
  var [pickOTC, pickOnDeck] = getPickInfo();
  var firstBlankRow = false;


  for (let i = 2; i <= totalPicks + 2; i++) {
    if (selectionSheet.getRange(i, 4).getValue() === "") { // Check for blank cell.
      if (!firstBlankRow) {
        if(pickOTC != i-1){
          pickOTC = i-1;
          selectionSheet.getRange('G6').setValue(pickOTC);
          selectionSheet.getRange('G7').copyTo(selectionSheet.getRange('G8'),{contentsOnly: true});
          Logger.log("On the Clock Pick");
          } else {
            Logger.log("Skipped Clock Pick");
          }
        firstBlankRow = true;
      } else {
        if(pickOTC != i-1){
          pickOnDeck = i-1;
          selectionSheet.getRange('G13').setValue(pickOnDeck);
        }
        break;
      }
    }
  }
}

function onEdit(e) {
  // Get the active spreadsheet and sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var selectionSheet = ss.getSheetByName("CBS MiL Draft");
  var historySheet = ss.getSheetByName("Pick History");
  var pickMadeEmailSheet = ss.getSheetByName("Pick Made Email")

  // Get the edited range and row/column
  var range = e.range;
  var row = range.getRow();
  var col = range.getColumn();

  // Check if the edit happened on the correct sheet and column
  if (ss.getActiveSheet().getName() === "CBS MiL Draft" && col === 4) {
    // Get the data from the entire edited row
    var rowData = selectionSheet.getRange(row,2,1,3).getValues()[0];

    pickEdited = rowData[1];
    Logger.log(rowData);

    if(!checkDraftStarted()){
      showAlert("Error!", "Draft has not started! Come back later.");
      selectionSheet.getRange(row,4,1,1).clear();
      return;
    }

    // Check to see if the pick is allowed
    if(!isPickAllowed(pickEdited)) {
      showAlert("It's not your Turn", "Uh uh uh, You didn't say the magic word!");
      selectionSheet.getRange(row,4,1,1).clear();
      return;
    }

    // Find the next available row in the target sheet
    const lastRowTarget = historySheet.getLastRow();
    const targetRow = lastRowTarget + 1;

    // Paste the data into the target sheet
    historySheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    historySheet.getRange(targetRow, 4, 1, 1).setValue(new Date());
    //historySheet.getRange(targetRow, 5, 1, 1).setValue("");
    pickMadeEmailSheet.getRange('B4').setValue([rowData[0]]);
    pickMadeEmailSheet.getRange('B3').setValue([rowData[1]]);
    pickMadeEmailSheet.getRange('B5').setValue([rowData[2]]);

  }
}

function sendEmail() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var pickMadeEmailSheet = ss.getSheetByName("Pick Made Email");
  var emailAddress = pickMadeEmailSheet.getRange('B1').getValues().toString();
  var emailSubject = pickMadeEmailSheet.getRange('B2').getValues().toString();
  var pickMadeNum = pickMadeEmailSheet.getRange('B3').getValues();
  var pickMadeBy = pickMadeEmailSheet.getRange('B4').getValues();
  var playerPicked = pickMadeEmailSheet.getRange('B5').getValues();
  var pickerOTC = pickMadeEmailSheet.getRange('B6').getValues();
  var pickOTC = pickMadeEmailSheet.getRange('B7').getValues();
  var pickOTCDeadline = pickMadeEmailSheet.getRange('B8').getValues();
  var pickerOnDeck = pickMadeEmailSheet.getRange('B9').getValues();
  var pickOnDeck = pickMadeEmailSheet.getRange('B10').getValues();

  // Email body
  var emailBody = HtmlService.createTemplateFromFile('draft pick');
  emailBody.pickMadeNum = pickMadeNum;
  emailBody.pickMadeBy = pickMadeBy;
  emailBody.playerPicked = playerPicked;
  emailBody.pickerOTC = pickerOTC;
  emailBody.pickOTC = pickOTC;
  //emailBody.pickOTCDeadline = pickOTCDeadline;
  emailBody.pickerOnDeck = pickerOnDeck;
  emailBody.pickOnDeck = pickOnDeck;
  var message = emailBody.evaluate().getContent();
  
  MailApp.sendEmail({to: emailAddress, subject: emailSubject, htmlBody: message});
}
