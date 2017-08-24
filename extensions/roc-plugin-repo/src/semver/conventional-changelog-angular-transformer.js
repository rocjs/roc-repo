/**
 Code taken from conventional-changelog-angular
*/

/* eslint-disable */
export default function(commit, context) {
  var discard = true;
  var issues = [];

  commit.notes.forEach(function(note) {
    note.title = 'BREAKING CHANGES';
    discard = false;
  });

  if (commit.type === 'feat') {
    commit.type = 'Features';
  } else if (commit.type === 'fix') {
    commit.type = 'Bug Fixes';
  } else if (commit.type === 'perf') {
    commit.type = 'Performance Improvements';
  } else if (commit.type === 'revert') {
    commit.type = 'Reverts';
  } else if (discard) {
    return;
  } else if (commit.type === 'docs') {
    commit.type = 'Documentation';
  } else if (commit.type === 'style') {
    commit.type = 'Styles';
  } else if (commit.type === 'refactor') {
    commit.type = 'Code Refactoring';
  } else if (commit.type === 'test') {
    commit.type = 'Tests';
  } else if (commit.type === 'chore') {
    commit.type = 'Chores';
  }

  if (commit.scope === '*') {
    commit.scope = '';
  }

  if (typeof commit.hash === 'string') {
    commit.hash = commit.hash.substring(0, 7);
  }

  if (typeof commit.subject === 'string') {
    var url = context.repository ?
      context.host + '/' + context.owner + '/' + context.repository :
      context.repoUrl;
    if (url) {
      url = url + '/issues/';
      // Issue URLs.
      commit.subject = commit.subject.replace(/#([0-9]+)/g, function(_, issue) {
        issues.push(issue);
        return '[#' + issue + '](' + url + issue + ')';
      });
    }
    if (context.host) {
      // User URLs.
      commit.subject = commit.subject.replace(/\B@([a-z0-9](?:-?[a-z0-9]){0,38})/g, '[@$1](' + context.host + '/$1)');
    }
  }

  // remove references that already appear in the subject
  commit.references = commit.references.filter(function(reference) {
    if (issues.indexOf(reference.issue) === -1) {
      return true;
    }

    return false;
  });

  return commit;
}
