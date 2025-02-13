/** @OnlyCurrentDoc */

// Confirm the pick
function confirmPick() {
  // Check the status of the draft
  if(!checkDraftStarted()){
    showAlert("Error!", "Draft has not started! Come back later.");
    Logger.log("Draft not started error displayed");
    return;
  }

  // Checks if confirmation is not allowed, and alerts the user if then need to pick a player
  if(!checkConfirmAllowed()){
    showAlert("Please select a player", "If you received this in error contact support");
    return;
  }
  
  // If confirmation is allowed update the OTC and On Deck picks 
  setPicks();

  // Log the confirmation in the logger
  Logger.log("Confirmation Pressed");

  // Check to see if commissioner enabled emails
  if(checkSendEmail()){
    // Format and send the email
    sendEmail();
    // Log the email as sent
    Logger.log('Email Sent!');
    // Alert the user the pick is complete and the email has been sent
    showAlert("Congratulations", "Pick submitted and email sent");
  } else {
    // If emails are disabled log that no email was sent
    Logger.log('No Email Sent!');
    // Alert the user that the pick is in but an email needs to be sent manually
    showAlert("Congratulations", "Pick submitted and please email league");
  }

}

// UI element for the Alert pop up
function showAlert(title, message) {
  SpreadsheetApp.getUi() // Or DocumentApp or FormApp.  Choose the appropriate one.
      .alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK); // You can customize the button set.
}

// Checks that the draft has started
function checkDraftStarted() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName("Settings");
  var draftStarted = settingsSheet.getRange('B1').getValue(); // true or false field in the spreadsheet
  return draftStarted;
}

// Checks the automated emails are enabled/disable in settigns tab
function checkSendEmail() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName("Settings");
  return settingsSheet.getRange('B12').getValue(); // true or false field in the spreadsheet
}

// Checks that a confirmation is allowed and prevents double clicking confirm pick button
function checkConfirmAllowed() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName("Settings");
  var confirmations = settingsSheet.getRange('B16').getValue();
  var currentNumePicks = settingsSheet.getRange('B15').getValue();
  // compares selections vs number of timed confirmation button has been pressed
  if(confirmations < currentNumePicks){
    confirmations++; // increment confirmations by 1
    settingsSheet.getRange('B16').setValue(confirmations); // updated the spreadsheet count
    return true; // allow confirmation
  }else{
    return false; // prevent the confirmations
  }
}

// Check to see if the current pick from the on the clock selection
function isPickAllowed(pickEdited){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var selectionSheet = ss.getSheetByName("CBS Mil Draft");
  
  // Get the OTC picker and On Deck Picker
  var [pickOTC,pickOnDeck] = getPickInfo(); 
  
  // Only allow the OTC and OnDeck picks to be selected
  if(pickEdited === pickOTC){ // if the pick the OTC picker
    return true;
  } else if(pickEdited === pickOnDeck && hasCountdownElapsed()) { // checks that the correct On Deck pick is allowed
    return true;
  }
  return false;
}

// Check to see if the On Deck picker can pick
function hasCountdownElapsed(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName("Settings");
  var countdownElapsed = settingsSheet.getRange('B2').getValue();
  return countdownElapsed; // true or false field in the spreadsheet
}

// Get the pick info from the sheet used for validations
function getPickInfo(){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var selectionSheet = ss.getSheetByName("CBS Mil Draft");
  var pickOTC = selectionSheet.getRange('G6').getValue();
  var pickOnDeck = selectionSheet.getRange('G13').getValue();
  return [pickOTC, pickOnDeck];
}

// Set the new OTC and On Deck pickers after both and OTC or On Deck pick
function setPicks() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var selectionSheet = ss.getSheetByName("CBS Mil Draft");
  var settingsSheet = ss.getSheetByName('Settings');
  var totalPicks = settingsSheet.getRange('B9').getValue();
  var [pickOTC, pickOnDeck] = getPickInfo();
  var firstBlankRow = false;

  // Finds the first two blank cells in the MiL Draft D Column
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

// Constant looks for edits to the Column D field in MiL Draft Tab
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

  // Check if the edit happened on the CBS MiL Draft Sheet and only in the 4th column
  if (ss.getActiveSheet().getName() === "CBS MiL Draft" && col === 4) {
    // Get the data from B-D columns in the edited row
    var rowData = selectionSheet.getRange(row,2,1,3).getValues()[0];

    pickEdited = rowData[1];
    Logger.log(rowData); // Logs the info

    // Show an error and clear the selection is the draft hasn't started yet
    if(!checkDraftStarted()){
      showAlert("Error!", "Draft has not started! Come back later.");
      selectionSheet.getRange(row,4,1,1).clear();
      return;
    }

    // Show an error if the pick isn't allowed and clear the selection
    if(!isPickAllowed(pickEdited)) {
      showAlert("It's not your Turn", "Uh uh uh, You didn't say the magic word!");
      selectionSheet.getRange(row,4,1,1).clear();
      return;
    }

    // Update the pick history tab
    // Finding the next available row in the target sheet
    const lastRowTarget = historySheet.getLastRow();
    const targetRow = lastRowTarget + 1;

    // Paste the data into the target sheet
    historySheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
    historySheet.getRange(targetRow, 4, 1, 1).setValue(new Date());
    //historySheet.getRange(targetRow, 5, 1, 1).setValue("");

    // Update the email data
    pickMadeEmailSheet.getRange('B4').setValue([rowData[0]]); // picker
    pickMadeEmailSheet.getRange('B3').setValue([rowData[1]]); // pick number
    pickMadeEmailSheet.getRange('B5').setValue([rowData[2]]); // Player picked

  }
}

// Send the email
function sendEmail() {
  // Get the sheet data
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var pickMadeEmailSheet = ss.getSheetByName("Pick Made Email");
  
  // Get the data for the Email template
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

  // Format the Email body
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
  
  // Send the email
  MailApp.sendEmail({to: emailAddress, subject: emailSubject, htmlBody: message});
}
