import {
  json,
  redirect,
  useCatch,
  useLoaderData,
  useParams,
  Link,
  Form,
} from "remix";
import { Button, Text, Link as ChakraLink } from "@chakra-ui/react";

import { db } from "~/utils/db.server";
import { getUserId, requireUserId } from "~/utils/session.server";

import type { Joke } from "@prisma/client";
import type { ActionFunction, LoaderFunction, MetaFunction } from "remix";

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: "No joke",
      description: "No joke found",
    };
  }
  return {
    title: `"${data.joke.name}" joke`,
    description: `Enjoy the "${data.joke.name}" joke and much more`,
  };
};

type LoaderData = {
  joke: Joke;
  isOwner: Boolean;
};
export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await getUserId(request);
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });
  if (!joke) {
    throw new Response("What a joke! Not found.", {
      status: 404,
    });
  }
  const data: LoaderData = {
    joke,
    isOwner: userId === joke.jokesterId,
  };
  return json(data);
};

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData();
  if (form.get("_method") !== "delete") {
    throw new Response(`The _method ${form.get("_method")} is not supported`, {
      status: 400,
    });
  }
  const joke = await db.joke.findUnique({
    where: { id: params.jokeId },
  });
  if (!joke) {
    throw new Response("Can't delete what does not exist", {
      status: 404,
    });
  }
  const userId = await requireUserId(request);
  if (joke.jokesterId !== userId) {
    throw new Response("Pssh, nice try. That's not your joke", { status: 401 });
  }
  await db.joke.delete({ where: { id: params.jokeId } });
  return redirect("/jokes");
};

export default function JokeRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <>
      <Text>Here's your hilarious joke:</Text>
      <Text>{data.joke.content}</Text>
      <ChakraLink as={Link} color="pink.500" to=".">
        {data.joke.name} Permalink
      </ChakraLink>

      {data.isOwner ? (
        <Form method="post">
          <input type="hidden" name="_method" value="delete"></input>
          <Button type="submit" colorScheme="red">
            Delete
          </Button>
        </Form>
      ) : null}
    </>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();

  switch (caught.status) {
    case 400: {
      return <Text>What you're trying to do is not allowed.</Text>;
    }
    case 401: {
      return <Text>Sorry, but {params.jokeId} is not your joke.</Text>;
    }
    case 404: {
      return <Text>Huh? What the heck is {params.jokeId}?</Text>;
    }
    default: {
      throw new Error(`Unhandled error: ${caught.status}`);
    }
  }
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  const { jokeId } = useParams();
  return (
    <div>{`There was an error loading joke by the id ${jokeId}. Sorry.`}</div>
  );
}
