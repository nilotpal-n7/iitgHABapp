const { Octokit } = require('@octokit/rest')
const fs = require('fs')
const path = require('path')

const eventPath = process.env.GITHUB_EVENT_PATH
const event = eventPath ? JSON.parse(fs.readFileSync(eventPath, 'utf8')) : {}
const comment = event.comment?.body?.trim()
const repo = event.repository
const issue_number = event.issue?.number
const author = event.comment?.user?.login
const isPR = !!event.issue.pull_request 

if (!comment || !repo || !issue_number || !author) {
  console.log('Event data is missing. Exiting.')
  process.exit(0)
}

const github = new Octokit({ auth: process.env.GITHUB_TOKEN })

async function postComment(body) {
  await github.issues.createComment({
    owner: repo.owner.login,
    repo: repo.name,
    issue_number: issue_number,
    body: body
  })
}

function parseLabels(commandPrefix) {
  return comment.replace(commandPrefix, '')
    .trim()
    .split(',')
    .map(label => label.trim())
    .filter(label => label.length > 0);
}

async function run() {
  if (comment.startsWith('/assign me') || comment.startsWith('/claim')) {
    try {
      await github.issues.addAssignees({
        owner: repo.owner.login,
        repo: repo.name,
        issue_number: issue_number,
        assignees: [author]
      })
      await postComment(`✅ Assigned to @${author}`)
    } catch (e) {
      console.error(e)
      await postComment(`❌ Failed to assign @${author}. Make sure they are a collaborator.`)
    }
  }

  if (comment.startsWith('/unassign me')) {
    try {
      await github.issues.removeAssignees({
        owner: repo.owner.login,
        repo: repo.name,
        issue_number: issue_number,
        assignees: [author]
      })
      await postComment(`✅ Unassigned @${author}`)
    } catch (e) {
      console.error(e)
      await postComment(`❌ Failed to unassign @${author}.`)
    }
  }

  if (comment.startsWith('/label') || comment.startsWith('/add label')) {
    const labels = parseLabels(comment.startsWith('/label') ? '/label' : '/add label');
    if (labels.length > 0) {
      try {
        await github.issues.addLabels({
          owner: repo.owner.login,
          repo: repo.name,
          issue_number: issue_number,
          labels: labels
        })
        await postComment(`✅ Added labels: ${labels.join(', ')}`)
      } catch (e) {
        console.error(e)
        await postComment(`❌ Failed to add labels. Make sure they exist in the repository.`)
      }
    } else {
      await postComment(`⚠️ Please specify labels. Example: \`/label bug, frontend\``)
    }
  }

  if (isPR) {
    const pr_number = issue_number

    if (comment.startsWith('/ready')) {
      await github.issues.addLabels({ owner: repo.owner.login, repo: repo.name, issue_number: pr_number, labels: ['ready-for-merge'] })
      await postComment('✅ Marked ready for merge.')
    }

    if (comment.startsWith('/rebase')) {
      try {
        await github.pulls.updateBranch({ owner: repo.owner.login, repo: repo.name, pull_number: pr_number })
        await postComment('🔄 Branch update with latest base has been triggered.')
      } catch (error) {
        console.error(error);
        await postComment('❌ Failed to rebase. Does the PR have merge conflicts?')
      }
    }

    if (comment.startsWith('r?') || comment.startsWith('/reviewer')) {
      const matches = comment.match(/@([a-zA-Z0-9-]+)/g);
      if (!matches || matches.length === 0) {
        await postComment('⚠️ Please mention at least one reviewer. Example: `/review @username`')
        return; 
      }
      
      const reviewers = matches.map(mention => mention.substring(1));
      try {
        await github.pulls.requestReviewers({
          owner: repo.owner.login,
          repo: repo.name,
          pull_number: pr_number,
          reviewers: reviewers,
        });
        await postComment(`✅ Review successfully requested from: ${matches.join(', ')}`)
      } catch (error) {
        console.error(error);
        await postComment(`❌ Failed to request review. Make sure the users ${matches.join(', ')} have access to this repository.`)
      }
    }
    
    if (comment.startsWith('/promote')) {
      await github.issues.addLabels({ owner: repo.owner.login, repo: repo.name, issue_number: pr_number, labels: ['promote'] })
      await postComment('🚀 Promotion requested: will merge dev → master when CI passes.')
    }

    if (comment.startsWith('/rollback')) {
      await github.issues.addLabels({ owner: repo.owner.login, repo: repo.name, issue_number: pr_number, labels: ['rollback'] })
      await postComment('⚠️ Rollback PR marked for review.')
    }
  }
}

run().catch(err => console.error(err))