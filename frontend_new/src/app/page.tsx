import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <section className="w-full py-20 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Plan Your Academic Journey with <span className="text-primary">Planumn</span>
        </h1>
        <p className="text-xl text-secondary max-w-2xl mx-auto mb-8">
          A graduation planning tool built for UMN students. Plan your courses, stay on track, and graduate with clarity.
        </p>
        <Link
          href="/plan"
          className="inline-block px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium shadow-sm"
        >
          Get Started
        </Link>
      </section>

      <section className="w-full py-16 bg-white">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Planumn?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Smart Course Planning</h3>
              <p className="text-secondary">
                Create and manage your academic plan with an intuitive interface designed for UMN students.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Stay On Track</h3>
              <p className="text-secondary">
                Visualize your progress and ensure you're meeting all graduation requirements.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-semibold mb-3">Make Informed Decisions</h3>
              <p className="text-secondary">
                Access course information and make better choices for your academic future.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-16 bg-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Planning?</h2>
          <p className="text-xl text-secondary mb-8">
            Join thousands of UMN students who have already planned their academic journey with Planumn.
          </p>
          <Link
            href="/plan"
            className="inline-block px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium shadow-sm"
          >
            Create Your Plan
          </Link>
        </div>
      </section>
    </div>
  );
}
