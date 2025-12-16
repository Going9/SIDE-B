import { data } from "react-router";
import type { Route } from "./+types/$category";
import { MENU_ITEMS, getCategoryBySlug, isValidCategory } from "../config/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

interface Post {
  id: string;
  title: string;
  description: string;
  date: string;
  imageUrl?: string;
}

interface LoaderData {
  category: {
    href: string;
    label: string;
    description: string;
    category: string;
  };
  posts: Post[];
}

// Mock posts data for each category
const MOCK_POSTS: Record<string, Post[]> = {
  mobility: [
    {
      id: "mob-1",
      title: "The Analog Drive in a Digital World: Mini Cooper",
      description:
        "In an era dominated by electric vehicles and autonomous driving, there's something profoundly human about the tactile experience of a manual transmission.",
      date: "2024-01-15",
    },
    {
      id: "mob-2",
      title: "Seoul at 2 AM",
      description:
        "A nocturnal journey through the city's hidden rhythms, where technology and tradition intersect in the quiet hours.",
      date: "2024-01-10",
    },
    {
      id: "mob-3",
      title: "The Philosophy of Manual Transmission",
      description:
        "Why choosing to shift gears manually in 2024 is more than nostalgia—it's a statement about intentionality and control.",
      date: "2024-01-05",
    },
  ],
  system: [
    {
      id: "sys-1",
      title: "Refactoring My Morning Routine",
      description:
        "How applying software engineering principles to daily life can create more reliable, maintainable systems for personal productivity.",
      date: "2024-01-12",
    },
    {
      id: "sys-2",
      title: "Kubernetes Home Lab Setup",
      description:
        "Building a personal Kubernetes cluster on bare metal. Lessons learned from running production workloads at home.",
      date: "2024-01-08",
    },
    {
      id: "sys-3",
      title: "The Art of System Design",
      description:
        "Understanding the principles that make systems resilient, scalable, and maintainable—both in code and in life.",
      date: "2024-01-03",
    },
  ],
  asset: [
    {
      id: "ast-1",
      title: "Why I bought NASDAQ instead of an Apartment",
      description:
        "A reflection on asset allocation, liquidity, and the philosophy of investing in systems rather than structures.",
      date: "2024-01-14",
    },
    {
      id: "ast-2",
      title: "My Dividend Portfolio Strategy",
      description:
        "How I structure my investment portfolio for long-term wealth building while maintaining liquidity for opportunities.",
      date: "2024-01-09",
    },
    {
      id: "ast-3",
      title: "The Compound Effect of Small Decisions",
      description:
        "How consistent, small financial choices compound over time to create significant wealth and freedom.",
      date: "2024-01-04",
    },
  ],
  kernel: [
    {
      id: "ker-1",
      title: "The calmness of 'Public Void'",
      description:
        "Exploring the philosophical implications of empty space in code, architecture, and life—where silence speaks louder than noise.",
      date: "2024-01-13",
    },
    {
      id: "ker-2",
      title: "The Philosophy of 'Void'",
      description:
        "What empty space teaches us about code architecture, minimalism, and the power of negative space in design.",
      date: "2024-01-07",
    },
    {
      id: "ker-3",
      title: "Minimalism as a Design Principle",
      description:
        "How less becomes more in both digital and physical spaces, and why constraints often lead to better solutions.",
      date: "2024-01-02",
    },
  ],
};

export function meta({ params, data }: Route.MetaArgs) {
  const category = getCategoryBySlug(params.category);
  if (!category) {
    return [{ title: "404 - Page Not Found" }];
  }
  return [
    { title: `${category.label} | SIDE B` },
    {
      name: "description",
      content: category.description,
    },
  ];
}

export async function loader({ params }: Route.LoaderArgs): Promise<LoaderData> {
  const categorySlug = params.category;

  // Validate category parameter
  if (!isValidCategory(categorySlug)) {
    throw data(null, { status: 404 });
  }

  const category = getCategoryBySlug(categorySlug);
  if (!category) {
    throw data(null, { status: 404 });
  }

  // Get mock posts for this category
  const posts = MOCK_POSTS[category.category] || [];

  return {
    category,
    posts,
  };
}

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
  const { category, posts } = loaderData;

  return (
    <div className="w-full">
      {/* Category Header */}
      <section className="w-full py-16 md:py-24 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-8">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
              Category
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-[#111111] tracking-tight mb-6">
            {category.label}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl">
            {category.description}
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="w-full py-16 px-6 bg-[#f8f9fa]">
        <div className="container mx-auto max-w-7xl">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No posts found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card key={post.id} className="h-full">
                  {/* Image Placeholder */}
                  <div className="relative aspect-[16/9] bg-gray-200 w-full">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <span className="text-xs uppercase tracking-wider font-mono">
                        {category.label}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                        {category.label}
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        {post.date}
                      </span>
                    </div>
                    <CardTitle className="text-2xl mb-3">{post.title}</CardTitle>
                    <CardDescription className="text-base">
                      {post.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

