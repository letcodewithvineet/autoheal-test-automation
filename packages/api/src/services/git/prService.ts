import { Octokit } from '@octokit/rest';
import { env } from '../../utils/env';
import { logger } from '../../utils/logger';
import fs from 'fs';
import path from 'path';

export interface PRCreationRequest {
  approvalId: string;
  suggestionId: string;
  failureId: string;
  oldSelector: string;
  newSelector: string;
  testName: string;
  specPath: string;
  commit: string;
  approvedBy: string;
  notes?: string;
}

export interface PRResult {
  prNumber: number;
  prUrl: string;
  branchName: string;
}

export class PRService {
  private octokit: Octokit;
  private repoOwner: string;
  private repoName: string;

  constructor() {
    // Initialize GitHub client
    if (env.GITHUB_TOKEN) {
      this.octokit = new Octokit({
        auth: env.GITHUB_TOKEN
      });
    } else if (env.GITHUB_APP_ID && env.GITHUB_INSTALLATION_ID && env.GITHUB_PRIVATE_KEY) {
      // GitHub App authentication would be implemented here
      throw new Error('GitHub App authentication not yet implemented');
    } else {
      throw new Error('No GitHub authentication configured');
    }

    // Parse repository name
    const [owner, name] = env.REPO_FULL_NAME.split('/');
    this.repoOwner = owner;
    this.repoName = name;
  }

  async createPRForApprovedSuggestion(request: PRCreationRequest): Promise<PRResult> {
    try {
      const branchName = `autoheal/update-${request.commit.substring(0, 7)}-${this.sanitizeBranchName(request.testName)}`;
      
      logger.info(`Creating PR for suggestion ${request.suggestionId} on branch ${branchName}`);

      // 1. Get the base branch
      const baseBranch = await this.getBaseBranch();
      
      // 2. Create new branch
      await this.createBranch(branchName, baseBranch.sha);
      
      // 3. Update selector files
      await this.updateSelectorFiles(branchName, request);
      
      // 4. Create pull request
      const pr = await this.createPullRequest(branchName, request);
      
      // 5. Add labels and request reviews
      await this.enhancePullRequest(pr.number);
      
      logger.info(`Created PR #${pr.number}: ${pr.html_url}`);
      
      return {
        prNumber: pr.number,
        prUrl: pr.html_url,
        branchName
      };
    } catch (error) {
      logger.error('Failed to create PR:', error);
      throw error;
    }
  }

  private async getBaseBranch() {
    const { data: branch } = await this.octokit.rest.repos.getBranch({
      owner: this.repoOwner,
      repo: this.repoName,
      branch: env.DEFAULT_BRANCH
    });
    
    return branch.commit;
  }

  private async createBranch(branchName: string, baseSha: string) {
    try {
      await this.octokit.rest.git.createRef({
        owner: this.repoOwner,
        repo: this.repoName,
        ref: `refs/heads/${branchName}`,
        sha: baseSha
      });
    } catch (error: any) {
      if (error.status === 422) {
        // Branch already exists, update it
        await this.octokit.rest.git.updateRef({
          owner: this.repoOwner,
          repo: this.repoName,
          ref: `heads/${branchName}`,
          sha: baseSha
        });
      } else {
        throw error;
      }
    }
  }

  private async updateSelectorFiles(branchName: string, request: PRCreationRequest) {
    // Update selectors.map.json
    await this.updateSelectorsMap(branchName, request);
    
    // Update Page Object files if they exist
    await this.updatePageObjectFiles(branchName, request);
  }

  private async updateSelectorsMap(branchName: string, request: PRCreationRequest) {
    const filePath = 'shared/selectors/selectors.map.json';
    
    try {
      // Get current file content
      const { data: fileData } = await this.octokit.rest.repos.getContent({
        owner: this.repoOwner,
        repo: this.repoName,
        path: filePath,
        ref: branchName
      });

      if ('content' in fileData) {
        const currentContent = Buffer.from(fileData.content, 'base64').toString();
        const selectorMap = JSON.parse(currentContent);
        
        // Find the key for this selector (simplified approach)
        const selectorKey = this.findSelectorKey(selectorMap, request.oldSelector);
        
        if (selectorKey) {
          selectorMap[selectorKey] = request.newSelector;
          
          const updatedContent = JSON.stringify(selectorMap, null, 2);
          
          // Update the file
          await this.octokit.rest.repos.createOrUpdateFileContents({
            owner: this.repoOwner,
            repo: this.repoName,
            path: filePath,
            message: `chore(autoheal): update selector for ${selectorKey} (#${request.failureId})`,
            content: Buffer.from(updatedContent).toString('base64'),
            sha: fileData.sha,
            branch: branchName
          });
          
          logger.info(`Updated selector map: ${selectorKey} -> ${request.newSelector}`);
        }
      }
    } catch (error: any) {
      if (error.status === 404) {
        // File doesn't exist, create it
        const selectorMap = {
          [`${this.extractPageName(request.specPath)}.${this.extractSelectorName(request.testName)}`]: request.newSelector
        };
        
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.repoOwner,
          repo: this.repoName,
          path: filePath,
          message: `chore(autoheal): create selector map with updated selector (#${request.failureId})`,
          content: Buffer.from(JSON.stringify(selectorMap, null, 2)).toString('base64'),
          branch: branchName
        });
      } else {
        throw error;
      }
    }
  }

  private async updatePageObjectFiles(branchName: string, request: PRCreationRequest) {
    // This is a simplified implementation
    // In practice, you'd need to parse TypeScript files and update them
    const pageName = this.extractPageName(request.specPath);
    const filePath = `shared/selectors/pageObjects/${pageName}.po.ts`;
    
    try {
      const { data: fileData } = await this.octokit.rest.repos.getContent({
        owner: this.repoOwner,
        repo: this.repoName,
        path: filePath,
        ref: branchName
      });

      if ('content' in fileData) {
        let content = Buffer.from(fileData.content, 'base64').toString();
        
        // Simple string replacement (in practice, you'd use AST parsing)
        content = content.replace(
          new RegExp(this.escapeRegExp(request.oldSelector), 'g'),
          request.newSelector
        );
        
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.repoOwner,
          repo: this.repoName,
          path: filePath,
          message: `chore(autoheal): update ${pageName} page object selector (#${request.failureId})`,
          content: Buffer.from(content).toString('base64'),
          sha: fileData.sha,
          branch: branchName
        });
        
        logger.info(`Updated page object file: ${filePath}`);
      }
    } catch (error: any) {
      if (error.status === 404) {
        logger.warn(`Page object file not found: ${filePath}`);
        // File doesn't exist, skip updating
      } else {
        throw error;
      }
    }
  }

  private async createPullRequest(branchName: string, request: PRCreationRequest) {
    const title = `chore(autoheal): update selector for ${request.testName}`;
    const body = this.generatePRDescription(request);
    
    const { data: pr } = await this.octokit.rest.pulls.create({
      owner: this.repoOwner,
      repo: this.repoName,
      title,
      body,
      head: branchName,
      base: env.DEFAULT_BRANCH
    });
    
    return pr;
  }

  private async enhancePullRequest(prNumber: number) {
    // Add labels
    try {
      await this.octokit.rest.issues.addLabels({
        owner: this.repoOwner,
        repo: this.repoName,
        issue_number: prNumber,
        labels: ['autoheal', 'test-fix']
      });
    } catch (error) {
      logger.warn('Failed to add labels to PR:', error);
    }

    // Request reviews from CODEOWNERS (simplified)
    try {
      await this.octokit.rest.pulls.requestReviewers({
        owner: this.repoOwner,
        repo: this.repoName,
        pull_number: prNumber,
        reviewers: ['team-lead'] // This would be read from CODEOWNERS file
      });
    } catch (error) {
      logger.warn('Failed to request reviews:', error);
    }
  }

  private generatePRDescription(request: PRCreationRequest): string {
    return `
## AutoHeal Selector Update

This PR was automatically created by AutoHeal to fix a failing test selector.

### Test Information
- **Test Name:** ${request.testName}
- **Spec Path:** ${request.specPath}
- **Failure ID:** ${request.failureId}
- **Approved By:** ${request.approvedBy}

### Selector Change
\`\`\`diff
- ${request.oldSelector}
+ ${request.newSelector}
\`\`\`

### Notes
${request.notes || 'No additional notes provided.'}

### Review Checklist
- [ ] Verify the new selector is more stable than the old one
- [ ] Ensure the selector correctly targets the intended element
- [ ] Check that no other tests are affected by this change
- [ ] Confirm the selector follows project conventions

---
*This PR was automatically created by AutoHeal. For more information, see the [AutoHeal documentation](docs/autoheal.md).*
`;
  }

  private findSelectorKey(selectorMap: Record<string, string>, oldSelector: string): string | null {
    for (const [key, value] of Object.entries(selectorMap)) {
      if (value === oldSelector) {
        return key;
      }
    }
    return null;
  }

  private extractPageName(specPath: string): string {
    const fileName = path.basename(specPath, '.spec.ts').replace('.spec', '');
    return fileName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  private extractSelectorName(testName: string): string {
    return testName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  private sanitizeBranchName(name: string): string {
    return name.replace(/[^a-zA-Z0-9\-_]/g, '-').toLowerCase().substring(0, 30);
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
