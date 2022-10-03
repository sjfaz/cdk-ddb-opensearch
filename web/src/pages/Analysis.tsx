import {
  AppLayout,
  ContentLayout,
  Header,
  Box,
  Container,
} from "@cloudscape-design/components";
import { Navigation } from "../components";

export function MainHeader() {
  return (
    <Header variant="h1" info={<div>OpenSearch with DynamoDB</div>}>
      Analysis
    </Header>
  );
}

export default function Analysis() {
  return (
    <AppLayout
      navigation={<Navigation activeHref="#/analysis" />}
      toolsHide={true}
      content={
        <ContentLayout header={<MainHeader />}>
          <Container header={<Header variant="h2">Scenario</Header>}>
            <div>TBC...</div>
          </Container>
          <Box padding="m" />
        </ContentLayout>
      }
    />
  );
}
