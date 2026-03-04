# Accounting Ledger App - Design Document

## Overview
A comprehensive mobile accounting application for managing multiple accounts, categories, transactions, and financial reports with local data storage.

## Screen List

### 1. **Home Screen (Dashboard)**
- Display all accounts in a scrollable list
- Each account card shows: name, balance (color-coded: green for positive, red for negative)
- Quick stats at bottom: total income, total expenses, net balance
- Floating action button (FAB) to add new account/transaction

### 2. **Account Detail Screen**
- Account name and current balance (large, prominent)
- List of all transactions for this account (sorted by date, newest first)
- Each transaction shows: date, amount (color-coded), description
- Floating action button to add new transaction
- Options menu (three dots) for: edit account, transfer, delete account

### 3. **Add/Edit Account Screen**
- Account name input field
- Category dropdown selector
- Initial balance input (optional)
- Save and Cancel buttons

### 4. **Add/Edit Transaction Screen**
- Date picker
- Amount input (numeric keyboard)
- Transaction type selector: Income (green) / Expense (red)
- Description/notes field
- Account selector (if applicable)
- Save and Cancel buttons

### 5. **Transfer Between Accounts Screen**
- From account (pre-selected or selector)
- To account selector
- Amount input
- Date picker
- Description field (auto-filled with "تحويل من...")
- Save and Cancel buttons

### 6. **Categories Management Screen**
- List of all categories
- Add new category input field
- Delete button for each category (with confirmation)

### 7. **Reports Screen**
- Summary report: total balance, positive accounts count, negative accounts count
- Detailed report: transactions by account
- Export options: PDF, CSV, JSON

### 8. **Settings Screen**
- App theme toggle (light/dark)
- Data backup/restore options
- Clear all data (with confirmation)
- About app

### 9. **Account Selector Modal**
- List of all accounts with their balances
- Search/filter capability
- Tap to select

## Primary Content and Functionality

### Home Screen
- **Content**: Account cards grid/list with balance indicators
- **Functionality**: 
  - Tap account to view details
  - Long-press account to edit/delete
  - FAB to add new account

### Account Detail Screen
- **Content**: Transaction list with date, amount, description
- **Functionality**:
  - Swipe to delete transaction
  - Tap transaction to edit
  - FAB to add transaction
  - Options menu for account actions

### Transaction Management
- **Content**: Form with date, amount, type, description
- **Functionality**:
  - Date picker with calendar
  - Amount validation (positive numbers)
  - Auto-calculate balance updates
  - Undo/redo capability (future enhancement)

## Key User Flows

### Flow 1: Create New Account
1. User taps FAB on home screen
2. Presented with "Add Account" screen
3. Enters account name, selects category, sets initial balance
4. Taps Save
5. Account appears on home screen
6. Balance is updated

### Flow 2: Record Transaction
1. User navigates to account detail
2. Taps FAB to add transaction
3. Selects date, enters amount, chooses type (income/expense)
4. Adds optional description
5. Taps Save
6. Transaction appears in list
7. Account balance updates automatically

### Flow 3: Transfer Between Accounts
1. User opens account detail
2. Taps options menu → "Transfer"
3. Selects destination account
4. Enters amount
5. Taps Save
6. Two transactions created (debit from source, credit to destination)
7. Both account balances update

### Flow 4: View Reports
1. User navigates to Reports tab
2. Sees summary statistics
3. Can tap "Detailed Report" to see transaction breakdown by account
4. Can export data in various formats

### Flow 5: Manage Categories
1. User navigates to Settings → Categories
2. Sees list of existing categories
3. Can add new category with name
4. Can delete category (only if no accounts use it)

## Color Scheme

### Primary Colors
- **Primary Blue**: #0a7ea4 (buttons, headers, active states)
- **Success Green**: #27ae60 (income, positive balances)
- **Danger Red**: #e74c3c (expenses, negative balances)
- **Warning Orange**: #f59e0b (alerts, warnings)

### Neutral Colors
- **Background**: #f5f5f5 (light mode) / #151718 (dark mode)
- **Surface**: #ffffff (light mode) / #1e2022 (dark mode)
- **Text Primary**: #11181c (light mode) / #ecedee (dark mode)
- **Text Secondary**: #687076 (light mode) / #9ba1a6 (dark mode)
- **Border**: #e5e7eb (light mode) / #334155 (dark mode)

### Component-Specific
- **Account Card Border**: Primary Blue (#0a7ea4)
- **Positive Amount**: Success Green (#27ae60)
- **Negative Amount**: Danger Red (#e74c3c)
- **Disabled State**: Muted Gray (#999999)

## Layout Principles

### Mobile-First (Portrait 9:16)
- All screens designed for portrait orientation
- One-handed usage: critical buttons within thumb reach
- Minimum touch target size: 44×44 points
- Safe area padding on notched devices

### Navigation Structure
- **Bottom Tab Navigation**: Home, Accounts, Reports, Settings
- **Modal Screens**: Add/Edit forms presented as modals
- **Nested Navigation**: Account detail is a stack screen

### Spacing & Typography
- **Padding**: 16px (standard), 8px (compact), 24px (generous)
- **Heading**: 24px, bold, primary color
- **Body**: 16px, regular, text primary
- **Caption**: 12px, secondary color
- **Line Height**: 1.5× font size for readability

### Responsive Behavior
- Lists use FlatList for performance
- Forms use ScrollView for long content
- Modals center on screen with semi-transparent backdrop
- FAB positioned at bottom-right, above tab bar
