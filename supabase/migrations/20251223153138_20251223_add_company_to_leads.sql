/*
  # Add company field to leads table

  1. Changes
    - Add `company` column to leads table (optional text field)
    - This field stores the company/organization name associated with the lead
*/

ALTER TABLE leads ADD COLUMN IF NOT EXISTS company text;
