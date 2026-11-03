import {defineConfig} from '@playwright/test'

// Start the existing .Codex MatterForge Lab QA launch entry before running.
export default defineConfig({
 testDir:'./tests',
 testMatch:'**/*.e2e.ts',
 timeout:20000,
 use:{baseURL:'http://127.0.0.1:5174',browserName:'chromium',channel:'chrome',headless:true},
 reporter:'list'
})
