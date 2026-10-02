-- ============================================================================
-- Add Offline/Online Mode Setting
-- ============================================================================
-- 
-- This migration adds the offline_online_mode setting to the settings table.
-- This allows administrators to choose between:
--   - OFFLINE/ONLINE MODE: Full offline + online sync capability (for clients who need it)
--   - ONLINE-ONLY MODE: Standard web application without sync overhead
--
-- Default: 1 (enabled) for backward compatibility with existing installations
--
-- Usage:
--   1 = OFFLINE/ONLINE MODE (sync infrastructure enabled - adds sync columns, tracking, UI)
--   0 = ONLINE-ONLY MODE (no sync infrastructure - pure CodeIgniter, no overhead)
--
-- This is NOT about auto-sync vs manual sync. This controls whether the entire
-- sync infrastructure exists at all. The separate 'sync_enabled' setting (future)
-- will control automatic vs manual sync behavior.
--
-- ============================================================================

-- Check if the setting already exists
SELECT 'Checking for existing offline_online_mode setting...' as 'Step 1';

-- Insert the setting if it doesn't exist
INSERT INTO `settings` (`type`, `description`)
SELECT 'offline_online_mode', '1'
WHERE NOT EXISTS (
    SELECT 1 FROM `settings` WHERE `type` = 'offline_online_mode'
);

-- Verify the setting was added
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'SUCCESS: offline_online_mode setting exists'
        ELSE 'ERROR: offline_online_mode setting not found'
    END as 'Step 2: Verification'
FROM `settings` 
WHERE `type` = 'offline_online_mode';

-- Show the current value
SELECT 
    `type`, 
    `description` as 'value',
    CASE 
        WHEN `description` = '1' THEN 'OFFLINE/ONLINE MODE'
        WHEN `description` = '0' THEN 'ONLINE-ONLY MODE'
        ELSE 'INVALID'
    END as 'status',
    `last_modified_at` as 'last_modified'
FROM `settings` 
WHERE `type` = 'offline_online_mode';

-- ============================================================================
-- Migration Complete
-- ============================================================================
