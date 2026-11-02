<template>
  <div
    class="
      flex flex-1 flex-col bg-[linear-gradient(180deg,#ffffff_0%,#f5f5f5_100%)]
      font-pan text-neutral-900
    "
  >
    <div
      class="
        mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-10
        sm:px-6 sm:py-16
      "
    >
      <div class="mb-4 flex justify-end">
        <Button
          as-child
          variant="outline"
          class="
            rounded-full border-pan-teal/40 bg-white/60 text-pan-teal
            hover:bg-pan-teal/10 hover:text-pan-teal
          "
        >
          <NuxtLink to="/dashboard">
            {{ $t('dashboard.title') }}
          </NuxtLink>
        </Button>
      </div>
      <HomeCreateForm />
    </div>
  </div>
</template>
