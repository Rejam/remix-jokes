import { Form, json, Link, Outlet, useLoaderData } from "remix";
import { Box, Button, Container, Flex, Heading, Text } from "@chakra-ui/react";

import { getUser } from "~/utils/session.server";
import { db } from "~/utils/db.server";

import type { LoaderFunction } from "remix";

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
  jokeListItems: Array<{ id: string; name: string }>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const jokeListItems = await db.joke.findMany({
    take: 5,
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });
  const user = await getUser(request);

  const data: LoaderData = {
    jokeListItems,
    user,
  };
  return json(data);
};

export default function JokesRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <Box bg="blue.100" minH="100vh">
      <header>
        <Box pos="sticky" top={0} bg="inherit" py={4} shadow="md">
          <Container maxW="container.lg">
            <Flex justifyContent="space-between" alignItems="center">
              <Heading as="h1">
                <Link to="/" title="Remix Jokes" aria-label="Remix Jokes">
                  <span>🤪</span>
                  <span>J🤪KES</span>
                </Link>
              </Heading>

              {data?.user ? (
                <Flex alignItems="center" gap={4}>
                  <Text>{`Hi ${data.user.username}`}</Text>
                  <Form action="/logout" method="post">
                    <Button type="submit">Logout</Button>
                  </Form>
                </Flex>
              ) : (
                <Button as={Link} to="/login">
                  Login
                </Button>
              )}
            </Flex>
          </Container>
        </Box>
      </header>
      <main>
        <Container maxW="container.lg" py={16}>
          <div>
            <Link to=".">Get a random joke</Link>
            <p>Here are a few more jokes to check out:</p>
            <ul>
              {data?.jokeListItems.map((joke) => (
                <li key={joke.id}>
                  <Link prefetch="intent" to={joke.id}>
                    {joke.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link to="new">Add your own</Link>
          </div>
          <div>
            <Outlet />
          </div>
        </Container>
      </main>
    </Box>
  );
}
