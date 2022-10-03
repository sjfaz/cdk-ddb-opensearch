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
  console.log("rendering analysis...");
  return (
    <AppLayout
      navigation={<Navigation activeHref="#/analysis" />}
      toolsHide={true}
      content={
        <ContentLayout header={<MainHeader />}>
          <Container header={<Header variant="h2">Scenario</Header>}>
            <div>A multi-tenant application with 1TB of data.</div>
            <p>Around 20000 tenants / average 50MB of data each.</p>
            <p>Average Item size of 2KB / average 25000 items each.</p>
          </Container>
          <Box padding="m" />
          <Container
            header={<Header variant="h2">OpenSearch for searching</Header>}
          >
            OpenSearch is a cluster-based solution that is designed for search.
            OpenSearch is a distributed system that can scale horizontally. We
            can add more nodes to the cluster to increase the capacity. We pay
            an hourly fee and there is no extra marginal fee for the data volume
            read. We have many options to use wildcard searches or regex
            searches. We can retrieve the total count easily to show the number
            of results which is useful for pagination.
            <Box padding="xs" />
            In the scenario above
          </Container>
          <Container
            header={<Header variant="h2">DynamoDB for searching</Header>}
          >
            When searching from DynamoDB we aim to filter using the sort key
            with KeyConditionExpression. This is because the sort key is indexed
            and therefore we can scan the least amount of data. This is
            important because with DynamoDB we pay for RCU (Read Capacity
            Units). If we have inefficient queries then it will not scale well
            for cost or performance. It is possible to use a Query with
            FilterExpression and contains but this will read the whole item
            colleciton. When we filter using the sort key can only use
            begins_with and not contains.
            <Box padding="xs" />
            Scenario above with FilterExpression and contains in DynamoDB:
            <pre>
              25000 items read * (100 * 365 days/ 12 months) / 4KB = 19m RCU per
              customer per month. $4.75 per customer * 20000 = $95k.
            </pre>
          </Container>
          <Box padding="m" />
        </ContentLayout>
      }
    />
  );
}

// export default function Analysis() {
//   return (
//     <AppLayout
//       navigation={<Navigation activeHref="/analysis" />}
//       toolsHide={true}
//       content={
//         <ContentLayout header={<MainHeader />}>
//           <Container header={<Header variant="h2">Scenario</Header>}>
//             <div>A multi-tenant application with 1TB of data.</div>
//             <p>Around 20000 tenants / average 50MB of data each.</p>
//             <p>Average Item size of 2KB / average 25000 items each.</p>
//           </Container>
//           <Box padding="m" />
//           <Container
//             header={<Header variant="h2">DynamoDB for searching</Header>}
//           >
//             When searching from DynamoDB we aim to filter using the sort key
//             with KeyConditionExpression. This is because the sort key is indexed
//             and therefore we can scan the least amount of data. This is
//             important because with DynamoDB we pay for RCU (Read Capacity
//             Units). If we have inefficient queries then it will not scale well
//             for cost or performance. It is possible to use a Query with
//             FilterExpression and contains but this will read the whole item
//             colleciton. When we filter using the sort key can only use
//             begins_with and not contains.
//             <Box padding="xs" />
//             Scenario above with FilterExpression and contains in DynamoDB:
//             <pre>
//               25000 items read * (100 * 365 days/ 12 months) / 4KB = 19m RCU per
//               customer per month. $4.75 per customer * 20000 = $95k.
//             </pre>
//           </Container>
//           <Box padding="m" />
//           <Container
//             header={<Header variant="h2">OpenSearch for searching</Header>}
//           >
//             OpenSearch is a cluster-based solution that is designed for search.
//             OpenSearch is a distributed system that can scale horizontally. We
//             can add more nodes to the cluster to increase the capacity. We pay
//             an hourly fee and there is no extra marginal fee for the data volume
//             read. We have many options to use wildcard searches or regex
//             searches. We can retrieve the total count easily to show the number
//             of results which is useful for pagination.
//             <Box padding="xs" />
//             In the scenario above
//           </Container>
//         </ContentLayout>
//       }
//     />
//   );
// }
