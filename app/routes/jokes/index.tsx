import { Joke } from "@prisma/client";
import { json, LoaderFunction, useCatch, useLoaderData } from "remix";

import { db } from "~/utils/db.server";

export const loader: LoaderFunction = async () => {
  const count = await db.joke.count();
  const randomRowNumber = Math.floor(Math.random() * count);

  const [randomJoke] = await db.joke.findMany({
    take: 1,
    skip: randomRowNumber,
  });

  if (!randomJoke) {
    throw new Response("No random joke found", {
      status: 404,
    });
  }
  const joke: Joke = randomJoke;
  return json(joke);
};

export default function JokesIndexRoute() {
  const joke = useLoaderData<Joke>();
  return (
    <div>
      <p>Here's a random joke:</p>
      <p>{joke.content}</p>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return <div>There are no jokes to display.</div>;
  }
  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary() {
  return <div>I did a whoopsies.</div>;
}
