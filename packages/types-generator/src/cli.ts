#!/usr/bin/env node

import type { GeneratorConfig, JSONSourceConfig, SQLiteSourceConfig } from './types/config';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { Command } from 'commander';
import { ContentrainTypesGenerator } from './index';

function findConfigFile(startPath: string): string | null {
    const configNames = ['contentrain-config.json', '.contentrain/config.json', '.config/contentrain.json'];
    let currentPath = startPath;

    while (currentPath !== path.parse(currentPath).root) {
        for (const configName of configNames) {
            const configPath = path.join(currentPath, configName);
            if (fs.existsSync(configPath)) {
                return configPath;
            }
        }
        currentPath = path.dirname(currentPath);
    }
    return null;
}

function loadConfig(configPath: string | undefined): Partial<GeneratorConfig> {
    if (!configPath) {
        return {};
    }

    try {
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
    }
    catch (error) {
        console.warn(`Warning: Failed to parse config file at ${configPath}:`, error);
        return {};
    }
}

function resolvePaths(config: Partial<GeneratorConfig>, basePath: string = process.cwd()): void {
    if ('source' in config) {
        if (config.source?.type === 'json') {
            const source = config.source;
            if (source.modelsDir) {
                source.modelsDir = path.resolve(basePath, source.modelsDir);
            }
            if (source.contentDir) {
                source.contentDir = path.resolve(basePath, source.contentDir);
            }
        }
        else if (config.source?.type === 'sqlite') {
            const source = config.source;
            if (source.databasePath) {
                source.databasePath = path.resolve(basePath, source.databasePath);
            }
        }
    }

    if (config.output?.dir) {
        config.output.dir = path.resolve(basePath, config.output.dir);
    }
}

async function main() {
    const program = new Command();

    program
        .option('-c, --config <path>', 'Path to config file')
        .option('-s, --source <type>', 'Source type (json|sqlite)')
        .option('-m, --models-dir <dir>', 'Models directory (for JSON source)')
        .option('-d, --content-dir <dir>', 'Content directory (for JSON source)')
        .option('-db, --database <path>', 'SQLite database path')
        .option('-o, --output-dir <dir>', 'Output directory')
        .option('-f, --filename <name>', 'Output filename')
        .parse(process.argv);

    const options = program.opts();

    // 1. Config dosyasını bul ve yükle
    const configPath = options.config || findConfigFile(process.cwd());
    const fileConfig = loadConfig(configPath);
    if (configPath) {
        resolvePaths(fileConfig, path.dirname(configPath));
    }

    // 2. CLI argümanlarından config oluştur
    const cliConfig: Partial<GeneratorConfig> = {
        output: {
            dir: options.outputDir || 'types',
            filename: options.filename,
        },
    };

    if (options.source === 'json') {
        (cliConfig as JSONSourceConfig).source = {
            type: 'json',
            modelsDir: options.modelsDir || 'contentrain/models',
            contentDir: options.contentDir || 'contentrain',
        };
    }
    else if (options.source === 'sqlite') {
        (cliConfig as SQLiteSourceConfig).source = {
            type: 'sqlite',
            databasePath: options.database || 'contentrain.db',
        };
    }
    else if (!fileConfig.source?.type) {
    // Varsayılan olarak JSON
        (cliConfig as JSONSourceConfig).source = {
            type: 'json',
            modelsDir: 'contentrain/models',
            contentDir: 'contentrain',
        };
    }

    resolvePaths(cliConfig);

    // 3. Config'leri birleştir (CLI argümanları öncelikli)
    const config = {
        ...fileConfig,
        ...cliConfig,
        output: {
            ...fileConfig.output,
            ...cliConfig.output,
        },
    } as GeneratorConfig;

    // 4. Generator'ı başlat
    const generator = new ContentrainTypesGenerator(config);
    await generator.generate();
}

main().catch((error) => {
    console.error('Error:', error);
    process.exit(1);
});
