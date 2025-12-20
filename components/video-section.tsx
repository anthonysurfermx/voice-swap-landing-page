export function VideoSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-center mb-8 sm:mb-12">
        SEE IT IN ACTION
      </h2>
      <div className="flex justify-center">
        <div className="relative w-full max-w-md aspect-[9/16] bg-black border-[3px] border-black brutalist-shadow overflow-hidden">
          <video
            className="w-full h-full object-cover"
            controls
            autoPlay
            muted
            loop
            playsInline
          >
            <source src="https://17usg51unah8rfmu.public.blob.vercel-storage.com/demo.mp4" type="video/mp4" />
            <source src="https://17usg51unah8rfmu.public.blob.vercel-storage.com/demo.mov" type="video/quicktime" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </section>
  )
}
