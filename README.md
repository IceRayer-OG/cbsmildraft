# CBS MiL Draft Summary

Google Gemini AI summary of what the code in code.gs does!

This Google Apps Script code manages a draft, likely for a fantasy sports league, within a Google Spreadsheet. Let's break down its functionality:

# Core Functionality:

__Draft Management:__ The script automates the process of making picks in a draft, ensuring picks are recorded and communicated.

__Pick Validation:__ It enforces rules, such as ensuring the draft has started, it's the user's turn, and a pick hasn't already been made.

__Pick Recording:__ When a valid pick is made, it's recorded in a "Pick History" sheet.

__Email Notification:__ Optionally, the script can send an email notification after a pick is made.

__"On the Clock" and "On Deck" Tracking:__ The script manages which pick is currently "on the clock" (the current turn) and who is "on deck" (the next turn).

# Code Breakdown:

__confirmPick():__ This function is likely triggered by a button click in the spreadsheet. It handles the pick confirmation process:

Checks if the draft has started (checkDraftStarted()).
Checks if a player has been selected (checkConfirmAllowed()).
Records the pick (setPicks()).
Sends an email notification if enabled (checkSendEmail() and sendEmail()).
Displays success/error messages using showAlert().
showAlert(title, message): Displays an alert dialog in the spreadsheet.

__checkDraftStarted():__ Reads a value from the "Settings" sheet to determine if the draft has started.

__checkSendEmail():__ Reads a value from the "Settings" sheet to determine if email notifications should be sent.

__checkConfirmAllowed():__ Manages the pick confirmation count per selection.

__isPickAllowed(pickEdited):__ Checks if the edited cell (representing a pick) is the current "on the clock" or "on deck" pick.  It uses hasCountdownElapsed() to check if the on deck pick can be made.

__hasCountdownElapsed():__ Reads from the "Settings" sheet to determine if the countdown for the on deck pick has elapsed.

__getPickInfo():__ Retrieves the current "on the clock" and "on deck" pick numbers from the "CBS Mil Draft" sheet.

__setPicks():__ Updates the "on the clock" and "on deck" picks after a successful pick is made. It finds the next available blank row in the draft order.

__onEdit(e):__ This is a trigger function that automatically runs when a cell in the spreadsheet is edited.  It's the core of the pick selection process:

Checks if the edit occurred in the correct column (column 4) of the "CBS MiL Draft" sheet.
Validates the pick using checkDraftStarted() and isPickAllowed().
Records the pick in the "Pick History" sheet.
Populates data in the "Pick Made Email" sheet for email generation.
sendEmail(): Sends an email notification using data from the "Pick Made Email" sheet. It uses an HTML template ("draft pick") for the email body.

# Key Improvements and Considerations:

__Error Handling:__ The script includes basic error handling with showAlert(), but more robust error handling could be added (e.g., using try...catch blocks).
__Data Validation:__ Consider adding more data validation to the onEdit() function to prevent invalid data from being entered.
__User Interface:__ A more user-friendly interface could be created using HTML Service dialogs or sidebars.
__Concurrency:__ If multiple users could potentially make picks simultaneously, the script needs to handle concurrency to prevent race conditions. This would likely require using locking mechanisms.
__Comments:__ The code is reasonably well-commented, which is helpful.

In summary, this script automates a fantasy draft process within a Google Spreadsheet, handling pick validation, recording, and email notifications. It's a good starting point and can be further enhanced with more advanced features and error handling.

