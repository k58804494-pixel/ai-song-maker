/**
 * Tool Execution Layer - Safe tool and API execution
 */
class ToolExecutionLayer {
    constructor() {
        this.registeredTools = new Map();
        this.executionLog = [];
        this.maxExecutionsPerMinute = 60;
        this.executionCount = 0;
        this.lastReset = Date.now();
        
        // Register built-in tools
        this._registerBuiltInTools();
    }

    _registerBuiltInTools() {
        this.registerTool('search', {
            description: 'Search for information',
            execute: async (params) => this._executeSearch(params)
        });

        this.registerTool('calculate', {
            description: 'Perform calculations',
            execute: async (params) => this._executeCalculate(params)
        });

        this.registerTool('read_file', {
            description: 'Read file contents (sandboxed)',
            execute: async (params) => this._executeReadFile(params)
        });

        this.registerTool('write_file', {
            description: 'Write to file (sandboxed)',
            execute: async (params) => this._executeWriteFile(params),
            requiresConfirmation: true
        });

        this.registerTool('run_command', {
            description: 'Execute shell command (sandboxed)',
            execute: async (params) => this._executeCommand(params),
            requiresConfirmation: true,
            dangerous: true
        });
    }

    registerTool(name, tool) {
        this.registeredTools.set(name, {
            name,
            ...tool,
            createdAt: Date.now()
        });
    }

    async execute(actionPlan) {
        if (!actionPlan) {
            return { success: false, error: 'No action plan provided' };
        }

        // Rate limiting
        this._checkRateLimit();

        const results = [];
        const actions = Array.isArray(actionPlan.actions) ? actionPlan.actions : [actionPlan.actions];

        for (const action of actions) {
            const result = await this._executeAction(action);
            results.push(result);
            
            this.executionLog.push({
                action,
                result,
                timestamp: Date.now()
            });
        }

        return {
            success: results.every(r => r.success),
            results,
            executedAt: Date.now()
        };
    }

    async _executeAction(action) {
        const toolName = action.tool || action.type;
        const tool = this.registeredTools.get(toolName);

        if (!tool) {
            return {
                success: false,
                error: `Unknown tool: ${toolName}`,
                availableTools: Array.from(this.registeredTools.keys())
            };
        }

        try {
            // Check confirmation requirement
            if (tool.requiresConfirmation && !action.confirmed) {
                return {
                    success: false,
                    requiresConfirmation: true,
                    tool: toolName,
                    action,
                    warning: 'This action requires user confirmation'
                };
            }

            // Execute the tool
            const result = await tool.execute(action.params || {});
            
            return {
                success: true,
                tool: toolName,
                result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                tool: toolName
            };
        }
    }

    async _executeSearch(params) {
        // Simulated search
        return {
            query: params.query,
            results: [
                { title: 'Result 1', snippet: 'Relevant information found' },
                { title: 'Result 2', snippet: 'Additional context' }
            ],
            totalResults: 2
        };
    }

    async _executeCalculate(params) {
        try {
            // Safe evaluation of mathematical expressions
            const expression = params.expression;
            if (!/^[\d+\-*/().\s]+$/.test(expression)) {
                throw new Error('Invalid mathematical expression');
            }
            const result = Function('"use strict";return (' + expression + ')')();
            return { expression, result };
        } catch (error) {
            return { error: 'Calculation failed: ' + error.message };
        }
    }

    async _executeReadFile(params) {
        // Sandboxed file reading simulation
        return {
            path: params.path,
            content: '[Simulated file content]',
            size: 1024
        };
    }

    async _executeWriteFile(params) {
        // Sandboxed file writing simulation
        return {
            path: params.path,
            written: true,
            bytes: params.content?.length || 0
        };
    }

    async _executeCommand(params) {
        // Sandboxed command execution simulation
        const dangerousCommands = ['rm', 'sudo', 'format', 'del', 'kill'];
        const cmd = params.command || '';
        
        if (dangerousCommands.some(dc => cmd.toLowerCase().includes(dc))) {
            return {
                blocked: true,
                reason: 'Dangerous command detected',
                command: cmd
            };
        }

        return {
            command: cmd,
            output: '[Simulated command output]',
            exitCode: 0
        };
    }

    _checkRateLimit() {
        const now = Date.now();
        
        // Reset counter every minute
        if (now - this.lastReset > 60000) {
            this.executionCount = 0;
            this.lastReset = now;
        }

        if (this.executionCount >= this.maxExecutionsPerMinute) {
            throw new Error('Rate limit exceeded. Maximum 60 executions per minute.');
        }

        this.executionCount++;
    }

    getStats() {
        return {
            registeredTools: this.registeredTools.size,
            totalExecutions: this.executionLog.length,
            executionsThisMinute: this.executionCount,
            rateLimit: this.maxExecutionsPerMinute
        };
    }

    getAvailableTools() {
        return Array.from(this.registeredTools.entries()).map(([name, tool]) => ({
            name,
            description: tool.description,
            requiresConfirmation: tool.requiresConfirmation || false,
            dangerous: tool.dangerous || false
        }));
    }
}

module.exports = { ToolExecutionLayer };
