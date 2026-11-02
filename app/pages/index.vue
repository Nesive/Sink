<template>
  <div class="flex flex-1 flex-col bg-[#0B100B] text-neutral-100">
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
            border-white/15 bg-transparent text-neutral-200
            hover:bg-white/10 hover:text-white
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
