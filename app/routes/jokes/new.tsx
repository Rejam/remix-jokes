import {
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import {
  ActionFunction,
  Form,
  json,
  Link,
  LoaderFunction,
  redirect,
  useActionData,
  useCatch,
} from "remix";

import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (!userId) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return json({});
};

type ActionData = {
  formError?: string;
  fieldErrors?: {
    name: string | undefined;
    content: string | undefined;
  };
  fields?: {
    name: string;
    content: string;
  };
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);

  const form = await request.formData();
  const name = form.get("name");
  const content = form.get("content");

  if (typeof name !== "string" || typeof content !== "string") {
    return badRequest({
      formError: `Form not submitted correctly.`,
    });
  }

  const fieldErrors = {
    name: validateJokeName(name),
    content: validateJokeContent(content),
  };
  const fields = { name, content };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  const joke = await db.joke.create({
    data: { ...fields, jokesterId: userId },
  });

  return redirect("/jokes/" + joke.id);
};

export default function NewJokeRoute() {
  const actionData = useActionData<ActionData>();

  return (
    <>
      <Heading as="h3">Add your own hilarious joke</Heading>
      <Container m={0} p={0}>
        <Form method="post">
          <Stack spacing={4} alignItems="flex-start">
            <FormControl isInvalid={Boolean(actionData?.fieldErrors?.name)}>
              <FormLabel>Name:</FormLabel>
              <Input
                variant="filled"
                type="text"
                name="name"
                defaultValue={actionData?.fields?.name}
              />
              <FormErrorMessage>
                {actionData?.fieldErrors?.name}
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={Boolean(actionData?.fieldErrors?.content)}>
              <FormLabel>Content:</FormLabel>
              <Textarea
                variant="filled"
                name="content"
                defaultValue={actionData?.fields?.content}
              />
              <FormErrorMessage>
                {actionData?.fieldErrors?.content}
              </FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={Boolean(actionData?.formError)}>
              <FormErrorMessage>{actionData?.formError}</FormErrorMessage>
            </FormControl>
            <Button type="submit">Add</Button>
          </Stack>
        </Form>
      </Container>
    </>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <>
        <Text>You must be logged in to create a joke.</Text>
        <Button as={Link} to="/login">
          Login
        </Button>
      </>
    );
  }
}

export function ErrorBoundary() {
  return <Text>Something unexpected went wrong. Sorry about that.</Text>;
}

function validateJokeName(name: string) {
  if (name.length < 3) {
    return `That joke's name is too short`;
  }
}
function validateJokeContent(content: string) {
  if (content.length < 10) {
    return `That joke is too short`;
  }
}
