import React from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "CaloricAI has completely transformed my relationship with food tracking. The AI-powered insights helped me reach my fitness goals 3 months ahead of schedule!",
      author: "Sarah Johnson",
      position: "Fitness Enthusiast & Personal Trainer",
      avatar: "https://img.freepik.com/free-photo/smiling-blond-woman-with-white-perfect-smile-natural-face-looking-happy-confident-camera-standing-tshirt-against-white-background_176420-54122.jpg?semt=ais_hybrid&w=740"
    },
    {
      quote: "As a nutritionist, I recommend CaloricAI to all my clients. The macro tracking accuracy and meal planning features make nutrition counseling so much more effective.",
      author: "Michael Chen",
      position: "Registered Dietitian",
      avatar: "https://bloximages.chicago2.vip.townnews.com/thestar.com/content/tncms/assets/v3/editorial/4/40/4403196c-665f-57a9-bf89-72f9d2cd9b3d/63e7e16e680f5.image.jpg"
    },
    {
      quote: "Lost 25 pounds in 6 months using CaloricAI! The smart food recognition and personalized calorie targets made healthy eating actually sustainable for me.",
      author: "Leila Rodriguez",
      position: "Working Mom & Health Coach",
      avatar: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe_ffNcrhB6I84h84P9feMDupiqtKgxWedNQ&s"
    }
  ];

  return (
    <section className="w-full py-20 px-6 md:px-12 bg-card relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 cosmic-grid opacity-20"></div>

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter text-foreground">
            Trusted by health enthusiasts worldwide
          </h2>
          <p className="text-muted-foreground text-lg">
            See how CaloricAI transforms nutrition tracking and helps achieve fitness goals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border border-border bg-background/80 backdrop-blur-sm hover:border-border/60 transition-all duration-300"
            >
              <div className="mb-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-primary inline-block mr-1">★</span>
                ))}
              </div>
              <p className="text-lg mb-8 text-foreground/90 italic">"{testimonial.quote}"</p>
              <div className="flex items-center gap-4">
                {testimonial.avatar.startsWith('http') ? (
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className={`h-12 w-12 rounded-full ${testimonial.avatar} bg-muted`}></div>
                )}
                <div>
                  <h4 className="font-medium text-foreground">{testimonial.author}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.position}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
