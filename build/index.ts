import {
  BuilderContext,
  BuilderOutput,
  createBuilder,
} from '@angular-devkit/architect';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import firebaseBuild from './actions';
import { experimental, json, normalize } from '@angular-devkit/core';
import { BuildTarget, DeployBuilderSchema, FirebaseRc } from '../interfaces';
import { readFileSync } from 'fs';
import { join } from 'path';

type DeployBuilderOptions = DeployBuilderSchema & json.JsonObject;

export function getFirebaseProjectName(
  workspaceRoot: string,
  target: string
): string | undefined {
  const rc: FirebaseRc = JSON.parse(
    readFileSync(join(workspaceRoot, '.firebaserc'), 'UTF-8')
  );
  const targets = rc.targets || {};
  const projects = Object.keys(targets || {});
  return projects.find(
    (project) =>
      !!Object.keys(targets[project].hosting).find((t) => t === target)
  );
}

// Call the createBuilder() function to create a builder. This mirrors
// createJobHandler() but add typings specific to Architect Builders.
export default createBuilder<any>(
  async (
    options: DeployBuilderOptions,
    context: BuilderContext
  ): Promise<BuilderOutput> => {
    // The project root is added to a BuilderContext.
    const host = new NodeJsSyncHost();
    const root = normalize(context.workspaceRoot);
    const workspace = new experimental.workspace.Workspace(root, host);
    await workspace
      .loadWorkspaceFromHost(normalize('angular.json'))
      .toPromise();

    if (!context.target) {
      throw new Error('Cannot deploy the application without a target');
    }

    const projectTargets = workspace.getProjectTargets(context.target.project);

    const firebaseProject = getFirebaseProjectName(
      context.workspaceRoot,
      context.target.project
    );

    if (!firebaseProject) {
      throw new Error(
        'Cannot find firebase project for your app in .firebaserc'
      );
    }

    let targets: BuildTarget[];

    if (!options.prerender) {
      targets = [
        {
          name: `${context.target.project}:build:production`,
        },
        {
          name: `${context.target.project}:server:production`,
          options: {
            bundleDependencies: true,
          },
        },
      ];
    } else {
      targets = [
        {
          name: `${context.target.project}:prerender`,
        },
      ];
    }

    try {
      await firebaseBuild(context, projectTargets, targets, host, root);
    } catch (e) {
      console.error('Error when trying to build: ');
      console.error(e.message);
      return { success: false };
    }

    return { success: true };
  }
);
