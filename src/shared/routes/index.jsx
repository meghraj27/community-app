/**
 * The top-level routing of the App.
 */

import Content from 'components/examples/Content';
import Error404 from 'components/Error404';
import SubmissionManagement from 'containers/SubmissionManagement';
import ChallengeListing from 'containers/ChallengeListing';
import 'isomorphic-fetch';
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import TopcoderFooter from 'components/TopcoderFooter';
import TopcoderHeader from 'containers/TopcoderHeader';
import CommunitiesHeader from 'containers/tc-communities/Header';

/* TODO: As we move towards production deploy, we should add a guard which
 * will prevent addition of /examples routes into production build. */
import Examples from './examples';

export default function Routes() {
  return (
    <div>
      <Route path="/challenge" component={TopcoderHeader} />
      <Route path="/community-challenge-listing" component={TopcoderHeader} />
      <Switch>
        <Route exact path="/" component={Content} />
        <Route exact path="/examples" component={Content} />
        <Route path="/examples" component={Examples} />
        <Route path="/challenge/:challengeId/my-submissions" component={SubmissionManagement} />
        <Route path="/community/:communityId/header" component={CommunitiesHeader} />
        <Route path="/community-challenge-listing/:keyword" component={ChallengeListing} />
        <Route component={Error404} />
      </Switch>
      <Route path="/challenge" component={TopcoderFooter} />
      <Route path="/community-challenge-listing" component={TopcoderFooter} />
    </div>
  );
}
