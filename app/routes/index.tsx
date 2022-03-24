import { Link } from "remix";

import type { MetaFunction } from "remix";

export const meta: MetaFunction = () => ({
  title: "Remix: So great, it's funny!",
  description: "Remix jokes app. Learn Remix and laugh at the same time!",
});

export default function Index() {
  return (
    <div>
      <h1>
        Remix <span>Jokes!</span>
      </h1>
      <nav>
        <ul>
          <li>
            <Link to="jokes">Read Jokes</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
