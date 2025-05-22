-- AlterTable
ALTER TABLE `username_file_config` MODIFY `folder_slug` VARCHAR(100) NULL,
    MODIFY `path` VARCHAR(200) NULL,
    MODIFY `variable` VARCHAR(200) NULL,
    MODIFY `config_type` VARCHAR(100) NULL;
