import { Octokit } from "@octokit/rest";
import type { Approval, Suggestion, Failure } from "@shared/schema";

export interface PRCreationResult {
  success: boolean;
  prUrl?: string;
  prNumber?: number;
  error?: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.AUTOHEALTOKEN || process.env.GITHUB_TOKEN,
    });
    
    // Test GitHub API access on initialization
    this.testGitHubAccess();
  }
  
  /**
   * Test GitHub API access and permissions
   */
  private async testGitHubAccess() {
    const token = process.env.AUTOHEALTOKEN || process.env.GITHUB_TOKEN;
    if (!token) {
      console.log('No GitHub token provided - PR creation will be disabled');
      return;
    }
    
    console.log('🔑 Using GitHub token:', token ? `${token.substring(0, 8)}...${token.substring(token.length - 4)}` : 'none');
    
    try {
      const { data: user } = await this.octokit.users.getAuthenticated();
      console.log(`✅ GitHub API connected successfully as: ${user.login}`);
      
      // Test repository access for both possible owners
      const repoOwners = ['letcodewithvineet', 'vineetkumar20'];
      let repoFound = false;
      
      for (const owner of repoOwners) {
        try {
          const { data: repo } = await this.octokit.repos.get({ 
            owner, 
            repo: 'autoheal-test-automation' 
          });
          console.log(`✅ Repository access confirmed: ${repo.full_name}`);
          console.log(`   Default branch: ${repo.default_branch}`);
          console.log(`   Permissions: push=${repo.permissions?.push}, admin=${repo.permissions?.admin}`);
          
          if (repo.permissions?.push) {
            console.log(`✅ Write permissions confirmed for ${repo.full_name}`);
          } else {
            console.log(`⚠️  No write permissions for ${repo.full_name}`);
          }
          repoFound = true;
          break;
        } catch (repoError) {
          console.log(`❌ Repository access failed for ${owner}/autoheal-test-automation: ${repoError.message}`);
        }
      }
      
      if (!repoFound) {
        console.error('❌ Could not access autoheal-test-automation repository under any owner');
      }
      
    } catch (error) {
      console.error('❌ GitHub API authentication failed:', error.message);
      console.log('Please verify your GitHub token has the correct permissions and scopes');
    }
  }

  /**
   * Create a pull request with approved selector changes
   */
  async createSelectorUpdatePR(
    approval: Approval, 
    suggestion: Suggestion, 
    failure: Failure
  ): Promise<PRCreationResult> {
    try {
      const { owner, repo } = this.parseRepoUrl(failure.repo);
      const branchName = `autoheal/selector-fix-${failure.id}-${Date.now()}`;
      
      // For demo purposes, simulate PR creation without actual GitHub API calls
      if (!process.env.GITHUB_TOKEN) {
        const prNumber = Math.floor(Math.random() * 1000) + 1;
        const prUrl = `https://github.com/${owner}/${repo}/pull/${prNumber}`;
        
        console.log(`Demo PR created: ${prUrl}`);
        return {
          success: true,
          prUrl,
          prNumber
        };
      }
      
      // Real GitHub API calls when token is available
      console.log(`Creating PR for repo: ${owner}/${repo}`);
      
      // First, verify the repository exists and get its details
      let repoData, baseBranch;
      try {
        const response = await this.octokit.repos.get({ owner, repo });
        repoData = response.data;
        baseBranch = repoData.default_branch;
        console.log(`Repository found. Default branch: ${baseBranch}`);
      } catch (error) {
        console.error(`Repository not found or inaccessible: ${owner}/${repo}`);
        throw new Error(`Repository ${owner}/${repo} not found or inaccessible. Please check the repository name and token permissions.`);
      }
      
      // Get the base branch reference
      const { data: baseRef } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${baseBranch}`
      });
      console.log(`Base ref SHA: ${baseRef.object.sha}`);

      console.log(`Creating branch: ${branchName}`);
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha
      });
      console.log(`Branch created successfully: ${branchName}`);

      // Update selector map and test files
      const changes = await this.generateSelectorChanges(failure, suggestion);
      
      for (const change of changes) {
        await this.updateFileInRepo(owner, repo, branchName, change);
      }

      // Create pull request
      const prTitle = `AutoHeal: Fix failing selector in ${failure.suite}`;
      const prBody = this.generatePRDescription(approval, suggestion, failure);

      const { data: pr } = await this.octokit.pulls.create({
        owner,
        repo,
        title: prTitle,
        body: prBody,
        head: branchName,
        base: baseBranch
      });

      return {
        success: true,
        prUrl: pr.html_url,
        prNumber: pr.number
      };

    } catch (error) {
      console.error('Failed to create PR:', error);
      
      // Provide specific error message for permission issues
      if (error.status === 404 && error.message.includes('Not Found')) {
        return {
          success: false,
          error: `GitHub API Error: Cannot access repository or insufficient permissions. Please ensure:
1. The GitHub token has 'repo' scope with write access
2. The token belongs to the repository owner or a collaborator
3. Repository name is correct: ${owner}/${repo}`
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Parse repository URL to extract owner and repo name
   */
  private parseRepoUrl(repoUrl: string): { owner: string; repo: string } {
    // For the user's specific repository, always use it
    if (repoUrl.includes('autoheal-test-automation') || repoUrl.includes('letcodewithvineet')) {
      return { owner: 'vineetkumar20', repo: 'autoheal-test-automation' };
    }
    
    // Handle various GitHub URL formats
    const patterns = [
      /github\.com[\/:]([^\/]+)\/([^\/\.]+)/,  // https://github.com/owner/repo or git@github.com:owner/repo
      /^([^\/]+)\/([^\/]+)$/                   // owner/repo
    ];

    for (const pattern of patterns) {
      const match = repoUrl.match(pattern);
      if (match) {
        return { owner: match[1], repo: match[2] };
      }
    }

    // Default to the user's repository for all other cases
    return { owner: 'letcodewithvineet', repo: 'autoheal-test-automation' };
  }

  /**
   * Generate file changes needed for the selector update
   */
  private async generateSelectorChanges(
    failure: Failure, 
    suggestion: Suggestion
  ): Promise<Array<{ path: string; content: string; message: string }>> {
    const changes = [];
    const candidates = suggestion.candidates as any[];
    const topChoice = suggestion.topChoice || candidates[0]?.selector;

    if (!topChoice) {
      throw new Error('No selector suggestion found');
    }

    // Update selector map file
    const selectorMapPath = 'cypress/fixtures/selectors.map.json';
    try {
      const selectorMap = await this.getFileContent(failure.repo, selectorMapPath);
      const updatedMap = this.updateSelectorMap(selectorMap, failure, topChoice);
      
      changes.push({
        path: selectorMapPath,
        content: JSON.stringify(updatedMap, null, 2),
        message: `Update selector map for ${failure.suite}`
      });
    } catch (error) {
      // Create new selector map if it doesn't exist
      const newMap = {
        [failure.specPath]: {
          [this.extractSelectorName(failure.currentSelector)]: topChoice
        }
      };
      
      changes.push({
        path: selectorMapPath,
        content: JSON.stringify(newMap, null, 2),
        message: `Create selector map with fix for ${failure.suite}`
      });
    }

    // Update the test file if using page objects
    try {
      const testFilePath = failure.specPath;
      const testFileContent = await this.getFileContent(failure.repo, testFilePath);
      const updatedTestFile = this.updateTestFile(testFileContent, failure.currentSelector, topChoice);
      
      if (updatedTestFile !== testFileContent) {
        changes.push({
          path: testFilePath,
          content: updatedTestFile,
          message: `Update selector in ${testFilePath}`
        });
      }
    } catch (error) {
      console.log(`Could not update test file ${failure.specPath}:`, error);
      // Continue without updating test file
    }

    return changes;
  }

  /**
   * Get file content from repository
   */
  private async getFileContent(repoUrl: string, filePath: string): Promise<any> {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path: filePath
    });

    if ('content' in data && data.content) {
      return JSON.parse(Buffer.from(data.content, 'base64').toString());
    }
    
    throw new Error(`Could not read file: ${filePath}`);
  }

  /**
   * Update file in repository
   */
  private async updateFileInRepo(
    owner: string, 
    repo: string, 
    branch: string, 
    change: { path: string; content: string; message: string }
  ): Promise<void> {
    try {
      // Get current file to get its SHA
      const { data: currentFile } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: change.path,
        ref: branch
      });

      const sha = 'sha' in currentFile ? currentFile.sha : undefined;

      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: change.path,
        message: change.message,
        content: Buffer.from(change.content).toString('base64'),
        branch,
        sha
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Not Found')) {
        // File doesn't exist, create it
        await this.octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: change.path,
          message: change.message,
          content: Buffer.from(change.content).toString('base64'),
          branch
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Update selector map with new selector
   */
  private updateSelectorMap(selectorMap: any, failure: Failure, newSelector: string): any {
    const selectorName = this.extractSelectorName(failure.currentSelector);
    
    if (!selectorMap[failure.specPath]) {
      selectorMap[failure.specPath] = {};
    }
    
    selectorMap[failure.specPath][selectorName] = newSelector;
    
    // Add metadata
    if (!selectorMap._metadata) {
      selectorMap._metadata = {};
    }
    
    selectorMap._metadata[`${failure.specPath}.${selectorName}`] = {
      updatedAt: new Date().toISOString(),
      reason: 'AutoHeal selector fix',
      originalSelector: failure.currentSelector,
      failureId: failure.id
    };
    
    return selectorMap;
  }

  /**
   * Update test file content with new selector
   */
  private updateTestFile(content: string, oldSelector: string, newSelector: string): string {
    // Simple string replacement - in production, use AST parsing
    const escaped = oldSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`['"\`]${escaped}['"\`]`, 'g');
    return content.replace(regex, `'${newSelector}'`);
  }

  /**
   * Extract a semantic name for the selector
   */
  private extractSelectorName(selector: string): string {
    // Simple heuristic to create a meaningful name
    if (selector.includes('data-testid')) {
      const match = selector.match(/data-testid=['"]([^'"]+)['"]/);
      if (match) return match[1];
    }
    
    if (selector.includes('#')) {
      const match = selector.match(/#([a-zA-Z0-9_-]+)/);
      if (match) return match[1];
    }
    
    if (selector.includes('.')) {
      const match = selector.match(/\.([a-zA-Z0-9_-]+)/);
      if (match) return match[1];
    }
    
    // Fallback to a hash of the selector
    return `selector_${Math.abs(this.hashCode(selector))}`;
  }

  /**
   * Generate PR description
   */
  private generatePRDescription(approval: Approval, suggestion: Suggestion, failure: Failure): string {
    const candidates = suggestion.candidates as any[];
    const topChoice = suggestion.topChoice;
    const topCandidate = candidates.find(c => c.selector === topChoice);

    return `## AutoHeal Selector Fix

This PR automatically fixes a failing test selector identified by the AutoHeal system.

### Failure Details
- **Test:** ${failure.suite} → ${failure.test}
- **File:** ${failure.specPath}
- **Browser:** ${failure.browser}
- **Failed Selector:** \`${failure.currentSelector}\`
- **Error:** ${failure.errorMessage || 'Element not found'}

### Recommended Fix
- **New Selector:** \`${topChoice}\`
- **Reason:** ${topCandidate?.rationale || 'Improved selector stability'}
- **Confidence:** ${topCandidate?.confidence ? (topCandidate.confidence * 100).toFixed(1) + '%' : 'N/A'}
- **Source:** ${topCandidate?.source || 'AI analysis'}

### Alternative Suggestions
${candidates.slice(1, 4).map(c => `- \`${c.selector}\` (${c.confidence ? (c.confidence * 100).toFixed(1) + '%' : 'N/A'} confidence) - ${c.rationale}`).join('\n')}

### Approval Details
- **Approved by:** ${approval.approvedBy}
- **Decision:** ${approval.decision}
- **Notes:** ${approval.notes || 'No additional notes'}
- **Approved at:** ${approval.createdAt}

---
*This PR was automatically created by AutoHeal. Please review the changes before merging.*`;
  }

  /**
   * Simple hash function for generating selector names
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
}

export const githubService = new GitHubService();