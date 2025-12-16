import type { Route } from "./+types/_index";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

interface Story {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  imageUrl?: string;
}

interface LoaderData {
  heroArticle: Story;
  curatedStories: Story[];
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "SIDE B | Editorial for Tech & Life" },
    {
      name: "description",
      content:
        "A modern lifestyle magazine exploring technology, mobility, systems, assets, and philosophy.",
    },
  ];
}

export async function loader({}: Route.LoaderArgs): Promise<LoaderData> {
  const heroArticle: Story = {
    id: "1",
    title: "The Analog Drive in a Digital World: Mini Cooper",
    description:
      "In an era dominated by electric vehicles and autonomous driving, there's something profoundly human about the tactile experience of a manual transmission and the character of a well-designed analog machine.",
    category: "Mobility",
    date: "2024-01-15",
  };

  const curatedStories: Story[] = [
    {
      id: "2",
      title: "Why I bought NASDAQ instead of an Apartment",
      description:
        "A reflection on asset allocation, liquidity, and the philosophy of investing in systems rather than structures.",
      category: "Asset",
      date: "2024-01-10",
    },
    {
      id: "3",
      title: "Refactoring My Morning Routine",
      description:
        "How applying software engineering principles to daily life can create more reliable, maintainable systems for personal productivity.",
      category: "System",
      date: "2024-01-08",
    },
    {
      id: "4",
      title: "The calmness of 'Public Void'",
      description:
        "Exploring the philosophical implications of empty space in code, architecture, and life—where silence speaks louder than noise.",
      category: "Kernel",
      date: "2024-01-05",
    },
    {
      id: "5",
      title: "Seoul at 2 AM",
      description:
        "A nocturnal journey through the city's hidden rhythms, where technology and tradition intersect in the quiet hours.",
      category: "Mobility",
      date: "2024-01-01",
    },
  ];

  return {
    heroArticle,
    curatedStories,
  };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  const { heroArticle, curatedStories } = loaderData;

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="w-full py-24 md:py-32 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl md:text-7xl font-bold text-[#111111] tracking-tight leading-none">
                LOGIC ON A,
                <br />
                LIFE ON B.
              </h1>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-lg">
                A developer's editorial on mobility, systems, assets, and philosophy.
              </p>
              <Button variant="default" size="lg" className="mt-4">
                Read Now
              </Button>
            </div>
            <div className="relative aspect-[4/3] bg-gray-100 rounded-none">
              {/* Placeholder for hero image */}
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <span className="text-sm uppercase tracking-wider">Hero Image</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editor's Pick - Masonry Grid */}
      <section className="w-full py-16 px-6 bg-[#f8f9fa]">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111111] tracking-tight mb-2">
              Editor's Pick
            </h2>
            <p className="text-gray-600">Curated stories from our editorial team</p>
          </div>

          {/* Masonry/Asymmetric Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {curatedStories.map((story, index) => {
              // Create visual hierarchy with different sizes
              const isLarge = index === 0;
              const isMedium = index === 1;

              return (
                <Card
                  key={story.id}
                  className={`${isLarge ? "md:col-span-2 lg:col-span-2" : ""} ${isMedium ? "lg:row-span-2" : ""}`}
                >
                  {/* Image Placeholder */}
                  <div className="relative aspect-[16/9] bg-gray-200 w-full">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <span className="text-xs uppercase tracking-wider font-mono">
                        {story.category}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                        {story.category}
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        {story.date}
                      </span>
                    </div>
                    <CardTitle className={`${isLarge ? "text-3xl" : "text-2xl"} mb-3`}>
                      {story.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {story.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Hero Article */}
      <section className="w-full py-16 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="mb-8">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
              Featured Story
            </span>
          </div>
          <Card className="overflow-hidden">
            <div className="relative aspect-[16/9] bg-gray-100 w-full">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <span className="text-sm uppercase tracking-wider">Featured Image</span>
              </div>
            </div>
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                  {heroArticle.category}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {heroArticle.date}
                </span>
              </div>
              <CardTitle className="text-4xl md:text-5xl mb-6">
                {heroArticle.title}
              </CardTitle>
              <CardDescription className="text-lg leading-relaxed mb-6">
                {heroArticle.description}
              </CardDescription>
              <Button variant="outline">Continue Reading</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
