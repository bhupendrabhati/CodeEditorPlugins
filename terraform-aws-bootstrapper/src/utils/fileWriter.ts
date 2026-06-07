import * as fs from 'fs';
import * as path from 'path';

/**
 * Result of a file write operation.
 */
export interface WriteResult {
    filePath: string;
    success: boolean;
    error?: string;
}

/**
 * Handles file system operations for writing generated content to disk.
 * Automatically creates parent directories as needed.
 */
export class FileWriter {
    /**
     * Writes content to a file, creating parent directories if they don't exist.
     *
     * @param filePath - Absolute path to the destination file.
     * @param content - String content to write.
     * @throws If the write operation fails.
     */
    static async writeFile(filePath: string, content: string): Promise<void> {
        const dir = path.dirname(filePath);

        try {
            await fs.promises.mkdir(dir, { recursive: true });
            await fs.promises.writeFile(filePath, content, 'utf8');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to write file "${filePath}": ${message}`);
        }
    }

    /**
     * Writes multiple files in parallel.
     *
     * @param files - Array of { filePath, content } objects.
     * @returns Array of WriteResult indicating success/failure per file.
     */
    static async writeFiles(
        files: { filePath: string; content: string }[]
    ): Promise<WriteResult[]> {
        const results = await Promise.allSettled(
            files.map(async ({ filePath, content }) => {
                await FileWriter.writeFile(filePath, content);
                return { filePath, success: true } as WriteResult;
            })
        );

        return results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            }
            return {
                filePath: files[index].filePath,
                success: false,
                error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
            } as WriteResult;
        });
    }

    /**
     * Deletes a directory and all its contents recursively.
     *
     * @param dirPath - Absolute path to the directory to delete.
     * @throws If the deletion fails.
     */
    static async deleteDirectory(dirPath: string): Promise<void> {
        try {
            await fs.promises.rm(dirPath, { recursive: true, force: true });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to delete directory "${dirPath}": ${message}`);
        }
    }

    /**
     * Checks if a file or directory exists at the given path.
     *
     * @param filePath - Path to check.
     * @returns True if the path exists.
     */
    static async exists(filePath: string): Promise<boolean> {
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }
}
