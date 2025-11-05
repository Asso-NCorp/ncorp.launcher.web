-- Update all tables to be 2x1 (horizontal rectangles)
UPDATE `table` SET `height` = 1 WHERE `height` = 2 AND `width` = 2;
