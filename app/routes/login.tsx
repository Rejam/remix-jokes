import {
  Form,
  ActionFunction,
  json,
  Link,
  useActionData,
  useSearchParams,
} from "remix";
import {
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Radio,
  RadioGroup,
  Stack,
} from "@chakra-ui/react";

import { db } from "~/utils/db.server";
import { createUserSession, login, register } from "~/utils/session.server";

import type { MetaFunction } from "remix";

export const meta: MetaFunction = () => {
  return {
    title: "Remix Jokes | Login",
    description: "Login to submit your own jokes to Remix Jokes!",
  };
};

type ActionData = {
  formError?: string;
  fieldErrors?: {
    username: string | undefined;
    password: string | undefined;
  };
  fields?: {
    loginType: string;
    username: string;
    password: string;
  };
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const redirectTo = form.get("redirectTo") || "/jokes";
  const loginType = form.get("loginType");
  const username = form.get("username");
  const password = form.get("password");

  console.log({ redirectTo, loginType, username, password });

  if (
    typeof loginType !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof redirectTo !== "string"
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    });
  }

  const fields = { loginType, username, password };
  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
  };
  if (Object.values(fieldErrors).some(Boolean))
    return badRequest({ fieldErrors, fields });

  switch (loginType) {
    case "login": {
      // login to get the user
      const user = await login({ username, password });

      // if there's no user, return the fields and a formError
      if (!user)
        return badRequest({
          fields,
          formError: `Username/Password combination is incorrect`,
        });
      // if there is a user, create their session and redirect to /jokes
      return createUserSession(user.id, redirectTo);
    }
    case "register": {
      const userExists = await db.user.findFirst({
        where: { username },
      });

      if (userExists) {
        return badRequest({
          fields,
          formError: `User with username ${username} already exists`,
        });
      }
      // create the user
      // create their session and redirect to /jokes
      const user = await register({ username, password });
      if (!user) {
        return badRequest({
          fields,
          formError: `Something went wrong trying to create a new user.`,
        });
      }
      return createUserSession(user.id, redirectTo);
    }
    default: {
      return badRequest({
        fields,
        formError: `Login type invalid`,
      });
    }
  }
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<ActionData>();

  return (
    <Container mt={16}>
      <Heading as="h1">Login</Heading>
      <Form method="post">
        <Stack spacing={4}>
          <Input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? undefined}
          />
          <RadioGroup
            defaultValue={
              !actionData?.fields?.loginType
                ? "login"
                : actionData?.fields?.loginType
            }
          >
            <Stack direction="row">
              <Radio type="radio" name="loginType" value="login">
                Login
              </Radio>
              <Radio type="radio" name="loginType" value="register">
                Register
              </Radio>
            </Stack>
          </RadioGroup>

          <FormControl
            isInvalid={Boolean(actionData?.fieldErrors?.username) || undefined}
          >
            <FormLabel htmlFor="username-input">Username</FormLabel>
            <Input
              type="text"
              id="username-input"
              name="username"
              defaultValue={actionData?.fields?.username}
              aria-errormessage={
                actionData?.fieldErrors?.username ? "username-error" : undefined
              }
            />
            <FormErrorMessage id="username-error">
              {actionData?.fieldErrors?.username}
            </FormErrorMessage>
          </FormControl>
          <FormControl
            isInvalid={Boolean(actionData?.fieldErrors?.password) || undefined}
          >
            <FormLabel htmlFor="password-input">Password</FormLabel>
            <Input
              type="password"
              id="password-input"
              name="password"
              defaultValue={actionData?.fields?.password}
              aria-errormessage={
                actionData?.fieldErrors?.password ? "password-error" : undefined
              }
            />
            <FormErrorMessage id="password-error">
              {actionData?.fieldErrors?.password}
            </FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={Boolean(actionData?.formError) || undefined}>
            <FormErrorMessage>{actionData?.formError}</FormErrorMessage>
          </FormControl>
          <Button type="submit">Submit</Button>
        </Stack>
      </Form>

      <div>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/jokes">Jokes</Link>
          </li>
        </ul>
      </div>
    </Container>
  );
}

export const ErrorBoundary = () => {
  return <div>Login Failed</div>;
};

function validateUsername(username: unknown) {
  if (typeof username !== "string" || username.length < 3) {
    return `Usernames must be at least 3 characters long`;
  }
}

function validatePassword(password: unknown) {
  if (typeof password !== "string" || password.length < 6) {
    return `Passwords must be at least 6 characters long`;
  }
}
