import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

// Import modules to test
import { TemplateEngine } from '../utils/templateEngine';
import { FileWriter } from '../utils/fileWriter';

// ---------------------------------------------------------------------------
// Unit Tests
// ---------------------------------------------------------------------------

describe('TemplateEngine', () => {
    describe('render', () => {
        it('should replace a single placeholder with its value', () => {
            const template = 'Hello, {{NAME}}!';
            const result = TemplateEngine.render(template, { NAME: 'World' });
            assert.strictEqual(result, 'Hello, World!');
        });

        it('should replace multiple placeholders', () => {
            const template = '{{GREETING}}, {{NAME}}!';
            const result = TemplateEngine.render(template, {
                GREETING: 'Hello',
                NAME: 'Terraform',
            });
            assert.strictEqual(result, 'Hello, Terraform!');
        });

        it('should replace the same placeholder appearing multiple times', () => {
            const template = '{{X}} + {{X}} = {{Y}}';
            const result = TemplateEngine.render(template, { X: '1', Y: '2' });
            assert.strictEqual(result, '1 + 1 = 2');
        });

        it('should leave unknown placeholders unchanged', () => {
            const template = 'Hello, {{NAME}}! {{UNKNOWN}}';
            const result = TemplateEngine.render(template, { NAME: 'World' });
            assert.strictEqual(result, 'Hello, World! {{UNKNOWN}}');
        });

        it('should handle an empty template', () => {
            const result = TemplateEngine.render('', { KEY: 'value' });
            assert.strictEqual(result, '');
        });

        it('should handle an empty variables map', () => {
            const template = 'No placeholders here.';
            const result = TemplateEngine.render(template, {});
            assert.strictEqual(result, 'No placeholders here.');
        });

        it('should handle values with special regex characters', () => {
            const template = '{{PATH}}';
            const result = TemplateEngine.render(template, { PATH: '/usr/local/bin' });
            assert.strictEqual(result, '/usr/local/bin');
        });

        it('should replace Terraform-style placeholders correctly', () => {
            const template = 'region = "{{AWS_REGION}}"\nprofile = "{{AWS_PROFILE}}"';
            const result = TemplateEngine.render(template, {
                AWS_REGION: 'us-west-2',
                AWS_PROFILE: 'my-profile',
            });
            assert.strictEqual(result, 'region = "us-west-2"\nprofile = "my-profile"');
        });
    });

    describe('load', () => {
        // Find templates directory relative to out/test/
        const projectRoot = path.resolve(__dirname, '..', '..', '..');
        const testTemplateDir = path.join(projectRoot, 'templates');

        it('should load an existing template file asynchronously', async () => {
            const templatePath = path.join(testTemplateDir, 'provider.tf.tpl');
            const content = await TemplateEngine.load(templatePath);
            assert.ok(content.includes('{{AWS_REGION}}'));
            assert.ok(content.includes('{{AWS_PROFILE}}'));
        });

        it('should throw for a non-existent template file', async () => {
            const templatePath = path.join(testTemplateDir, 'nonexistent.tpl');
            try {
                await TemplateEngine.load(templatePath);
                assert.fail('Should have thrown an error');
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : '';
                assert.ok(message.includes('Failed to load template'));
            }
        });
    });

    describe('loadAndRender', () => {
        it('should load and render a template in one call', async () => {
            const projectRoot = path.resolve(__dirname, '..', '..', '..');
            const templatePath = path.join(projectRoot, 'templates', 'provider.tf.tpl');
            const result = await TemplateEngine.loadAndRender(templatePath, {
                AWS_REGION: 'eu-west-1',
                AWS_PROFILE: 'test-profile',
            });
            assert.ok(result.includes('eu-west-1'));
            assert.ok(result.includes('test-profile'));
        });
    });
});

describe('FileWriter', () => {
    const testDir = path.join(__dirname, '..', '..', '..', '.test-output');

    beforeEach(async () => {
        if (await FileWriter.exists(testDir)) {
            await FileWriter.deleteDirectory(testDir);
        }
    });

    afterEach(async () => {
        if (await FileWriter.exists(testDir)) {
            await FileWriter.deleteDirectory(testDir);
        }
    });

    describe('writeFile', () => {
        it('should write a file to disk', async () => {
            const filePath = path.join(testDir, 'test.txt');
            await FileWriter.writeFile(filePath, 'Hello, World!');
            const exists = await FileWriter.exists(filePath);
            assert.strictEqual(exists, true);

            const content = await fs.promises.readFile(filePath, 'utf8');
            assert.strictEqual(content, 'Hello, World!');
        });

        it('should create parent directories automatically', async () => {
            const filePath = path.join(testDir, 'nested', 'deep', 'file.txt');
            await FileWriter.writeFile(filePath, 'Nested file');
            const exists = await FileWriter.exists(filePath);
            assert.strictEqual(exists, true);
        });

        it('should overwrite an existing file', async () => {
            const filePath = path.join(testDir, 'overwrite.txt');
            await FileWriter.writeFile(filePath, 'Original content');
            await FileWriter.writeFile(filePath, 'Updated content');
            const content = await fs.promises.readFile(filePath, 'utf8');
            assert.strictEqual(content, 'Updated content');
        });

        it('should throw for an invalid path', async () => {
            try {
                await FileWriter.writeFile('', 'content');
                assert.fail('Should have thrown an error');
            } catch (error: unknown) {
                assert.ok(error instanceof Error);
            }
        });
    });

    describe('writeFiles', () => {
        it('should write multiple files in parallel', async () => {
            const files = [
                { filePath: path.join(testDir, 'a.txt'), content: 'File A' },
                { filePath: path.join(testDir, 'b.txt'), content: 'File B' },
                { filePath: path.join(testDir, 'c.txt'), content: 'File C' },
            ];
            const results = await FileWriter.writeFiles(files);
            assert.strictEqual(results.length, 3);
            for (const result of results) {
                assert.strictEqual(result.success, true);
            }
        });
    });

    describe('exists', () => {
        it('should return true for an existing file', async () => {
            const filePath = path.join(testDir, 'exists-test.txt');
            await FileWriter.writeFile(filePath, 'test');
            const exists = await FileWriter.exists(filePath);
            assert.strictEqual(exists, true);
        });

        it('should return false for a non-existent file', async () => {
            const filePath = path.join(testDir, 'does-not-exist.txt');
            const exists = await FileWriter.exists(filePath);
            assert.strictEqual(exists, false);
        });
    });

    describe('deleteDirectory', () => {
        it('should delete a directory and its contents', async () => {
            await FileWriter.writeFile(path.join(testDir, 'sub', 'file.txt'), 'content');
            await FileWriter.deleteDirectory(testDir);
            const exists = await FileWriter.exists(testDir);
            assert.strictEqual(exists, false);
        });

        it('should not throw when deleting a non-existent directory', async () => {
            await FileWriter.deleteDirectory('/tmp/nonexistent-delete-test-12345');
        });
    });
});

// ---------------------------------------------------------------------------
// Generator Integration Tests
// ---------------------------------------------------------------------------

describe('Generators', () => {
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const templateDir = path.join(projectRoot, 'templates');
    const templateVars = {
        PROJECT_NAME: 'test-project',
        AWS_REGION: 'us-east-1',
        VPC_CIDR: '10.0.0.0/16',
        PUBLIC_SUBNET_CIDR: '10.0.1.0/24',
        INSTANCE_TYPE: 't2.micro',
        INSTANCE_NAME: 'test-server',
        STATE_BUCKET: 'test-bucket',
        LOCK_TABLE: 'test-lock-table',
        AWS_PROFILE: 'test-profile',
    };

    it('should generate provider.tf with correct values', async () => {
        const { ProviderGenerator } = await import('../generators/providerGenerator');
        const generator = new ProviderGenerator();
        const files = await generator.generate(templateVars, templateDir);

        assert.strictEqual(files.length, 1);
        assert.strictEqual(files[0].filename, 'provider.tf');
        assert.ok(files[0].content.includes('us-east-1'));
        assert.ok(files[0].content.includes('test-profile'));
        assert.ok(files[0].content.includes('provider "aws"'));
    });

    it('should generate backend.tf with correct values', async () => {
        const { BackendGenerator } = await import('../generators/backendGenerator');
        const generator = new BackendGenerator();
        const files = await generator.generate(templateVars, templateDir);

        assert.strictEqual(files.length, 1);
        assert.strictEqual(files[0].filename, 'backend.tf');
        assert.ok(files[0].content.includes('test-bucket'));
        assert.ok(files[0].content.includes('test-lock-table'));
        assert.ok(files[0].content.includes('backend "s3"'));
    });

    it('should generate main.tf with VPC configuration', async () => {
        const { VpcGenerator } = await import('../generators/vpcGenerator');
        const generator = new VpcGenerator();
        const files = await generator.generate(templateVars, templateDir);

        assert.strictEqual(files.length, 1);
        assert.strictEqual(files[0].filename, 'main.tf');
        assert.ok(files[0].content.includes('aws_vpc'));
        assert.ok(files[0].content.includes('10.0.0.0/16'));
        assert.ok(files[0].content.includes('aws_subnet'));
        assert.ok(files[0].content.includes('10.0.1.0/24'));
        assert.ok(files[0].content.includes('aws_internet_gateway'));
        assert.ok(files[0].content.includes('aws_route_table'));
    });

    it('should generate main.tf with EC2 configuration', async () => {
        const { Ec2Generator } = await import('../generators/ec2Generator');
        const generator = new Ec2Generator();
        const files = await generator.generate(templateVars, templateDir);

        assert.strictEqual(files.length, 1);
        assert.strictEqual(files[0].filename, 'main.tf');
        assert.ok(files[0].content.includes('aws_instance'));
        assert.ok(files[0].content.includes('t2.micro'));
        assert.ok(files[0].content.includes('aws_security_group'));
    });

    it('should generate variables.tf with correct defaults', async () => {
        const { VariableGenerator } = await import('../generators/variableGenerator');
        const generator = new VariableGenerator();
        const files = await generator.generate(templateVars, templateDir);

        assert.strictEqual(files.length, 1);
        assert.strictEqual(files[0].filename, 'variables.tf');
        assert.ok(files[0].content.includes('us-east-1'));
        assert.ok(files[0].content.includes('10.0.0.0/16'));
        assert.ok(files[0].content.includes('test-project'));
    });

    it('should generate outputs.tf with expected outputs', async () => {
        const { OutputGenerator } = await import('../generators/outputGenerator');
        const generator = new OutputGenerator();
        const files = await generator.generate(templateVars, templateDir);

        assert.strictEqual(files.length, 1);
        assert.strictEqual(files[0].filename, 'outputs.tf');
        assert.ok(files[0].content.includes('output "vpc_id"'));
        assert.ok(files[0].content.includes('output "ec2_instance_public_ip"'));
    });
});

// ---------------------------------------------------------------------------
// Full Pipeline Integration Test
// ---------------------------------------------------------------------------

describe('Full Project Generation Pipeline', () => {
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const templateDir = path.join(projectRoot, 'templates');
    const testOutputDir = path.join(projectRoot, '.test-generated-project');

    const templateVars = {
        PROJECT_NAME: 'integration-test',
        AWS_REGION: 'ap-southeast-1',
        VPC_CIDR: '172.16.0.0/16',
        PUBLIC_SUBNET_CIDR: '172.16.1.0/24',
        INSTANCE_TYPE: 't3.micro',
        INSTANCE_NAME: 'integration-server',
        STATE_BUCKET: 'integration-test-bucket',
        LOCK_TABLE: 'integration-lock-table',
        AWS_PROFILE: 'integration-profile',
    };

    before(async () => {
        if (await FileWriter.exists(testOutputDir)) {
            await FileWriter.deleteDirectory(testOutputDir);
        }
    });

    after(async () => {
        if (await FileWriter.exists(testOutputDir)) {
            await FileWriter.deleteDirectory(testOutputDir);
        }
    });

    it('should generate all expected Terraform files', async () => {
        const { ProviderGenerator } = await import('../generators/providerGenerator');
        const { BackendGenerator } = await import('../generators/backendGenerator');
        const { VpcGenerator } = await import('../generators/vpcGenerator');
        const { Ec2Generator } = await import('../generators/ec2Generator');
        const { VariableGenerator } = await import('../generators/variableGenerator');
        const { OutputGenerator } = await import('../generators/outputGenerator');

        const generators = [
            new ProviderGenerator(),
            new BackendGenerator(),
            new VpcGenerator(),
            new Ec2Generator(),
            new VariableGenerator(),
            new OutputGenerator(),
        ];

        // Collect and merge outputs
        const allFiles = new Map<string, string>();

        for (const generator of generators) {
            const files = await generator.generate(templateVars, templateDir);
            for (const file of files) {
                const existing = allFiles.get(file.filename);
                allFiles.set(file.filename, existing ? existing + '\n\n' + file.content : file.content);
            }
        }

        // Add versions.tf
        const versionsContent = await TemplateEngine.loadAndRender(
            path.join(templateDir, 'versions.tf.tpl'),
            templateVars
        );
        allFiles.set('versions.tf', versionsContent);

        // Write all files
        for (const [filename, content] of allFiles) {
            const filePath = path.join(testOutputDir, filename);
            await FileWriter.writeFile(filePath, content);
        }

        // Also write supplementary files
        await FileWriter.writeFile(
            path.join(testOutputDir, 'terraform.tfvars.example'),
            '# Test tfvars'
        );

        // Assert all expected files exist
        const expectedFiles = [
            'provider.tf',
            'backend.tf',
            'versions.tf',
            'main.tf',
            'variables.tf',
            'outputs.tf',
            'terraform.tfvars.example',
        ];

        for (const filename of expectedFiles) {
            const filePath = path.join(testOutputDir, filename);
            const exists = await FileWriter.exists(filePath);
            assert.strictEqual(
                exists,
                true,
                `Expected file "${filename}" was not generated`
            );
        }

        // Verify content of key files
        const providerContent = await fs.promises.readFile(
            path.join(testOutputDir, 'provider.tf'),
            'utf8'
        );
        assert.ok(providerContent.includes('ap-southeast-1'));
        assert.ok(providerContent.includes('integration-profile'));

        const mainContent = await fs.promises.readFile(
            path.join(testOutputDir, 'main.tf'),
            'utf8'
        );
        assert.ok(mainContent.includes('172.16.0.0/16'));
        assert.ok(mainContent.includes('172.16.1.0/24'));
        assert.ok(mainContent.includes('t3.micro'));
        assert.ok(mainContent.includes('integration-server'));
        assert.ok(mainContent.includes('aws_vpc'));
        assert.ok(mainContent.includes('aws_instance'));

        const variablesContent = await fs.promises.readFile(
            path.join(testOutputDir, 'variables.tf'),
            'utf8'
        );
        assert.ok(variablesContent.includes('ap-southeast-1'));

        const outputsContent = await fs.promises.readFile(
            path.join(testOutputDir, 'outputs.tf'),
            'utf8'
        );
        assert.ok(outputsContent.includes('output "vpc_id"'));
        assert.ok(outputsContent.includes('output "ec2_instance_public_ip"'));
    });
});
