<script setup lang="ts">
import { AlertCircle, Check, ChevronDown, Copy, Loader2, Shuffle } from '@lucide/vue'
import { useClipboard } from '@vueuse/core'
import { MAX_URL_LENGTH, nanoid, SlugSchema } from '#shared/schemas/link'
import { getAuthToken } from '@/utils/auth-token'

const { t, locale } = useI18n()

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

const longUrl = shallowRef('')
const slug = shallowRef('')
const advancedOpen = shallowRef(false)
const status = shallowRef<FormStatus>('idle')
const errorMessage = shallowRef('')
const shortLink = shallowRef('')
const loggedIn = shallowRef(false)

const urlInput = useTemplateRef<HTMLInputElement>('urlInput')
const slugInput = useTemplateRef<HTMLInputElement>('slugInput')

const { copy, copied } = useClipboard({ copiedDuring: 2000 })

onMounted(() => {
  loggedIn.value = !!getAuthToken()
})

watch([longUrl, slug], () => {
  errorMessage.value = ''
})

function validateLongUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed)
    return t('home.create.error_empty')
  if (trimmed.length > MAX_URL_LENGTH)
    return t('home.create.error_too_long', { max: MAX_URL_LENGTH.toLocaleString(locale.value) })
  if (!URL.canParse(trimmed))
    return t('home.create.error_invalid')
  return null
}

function randomizeSlug() {
  slug.value = nanoid()
  slugInput.value?.focus()
}

async function handleSubmit() {
  if (status.value === 'submitting')
    return

  errorMessage.value = ''

  const urlError = validateLongUrl(longUrl.value)
  if (urlError) {
    errorMessage.value = urlError
    status.value = 'error'
    await nextTick()
    urlInput.value?.focus()
    return
  }

  const trimmedSlug = slug.value.trim()
  if (trimmedSlug && !SlugSchema.safeParse(trimmedSlug).success) {
    errorMessage.value = t('home.create.error_slug_invalid')
    status.value = 'error'
    await nextTick()
    slugInput.value?.focus()
    return
  }

  if (!getAuthToken()) {
    errorMessage.value = t('home.create.error_login_required')
    status.value = 'error'
    return
  }

  status.value = 'submitting'
  try {
    const { link } = await useAPI<{ link: { slug: string } }>('/api/link/create', {
      method: 'POST',
      body: trimmedSlug
        ? { url: longUrl.value.trim(), slug: trimmedSlug }
        : { url: longUrl.value.trim() },
    })
    shortLink.value = `${window.location.origin}/${link.slug}`
    status.value = 'success'
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    errorMessage.value = message || t('home.create.error_failed')
    status.value = 'error'
  }
}

function resetForm() {
  longUrl.value = ''
  slug.value = ''
  advancedOpen.value = false
  errorMessage.value = ''
  shortLink.value = ''
  status.value = 'idle'
  nextTick(() => urlInput.value?.focus())
}
</script>

<template>
  <div
    class="
      w-full rounded-2xl border border-[#CDF463]/25 bg-white/4 p-5
      shadow-[0_0_60px_rgba(205,244,99,0.12)]
      sm:p-8
    "
  >
    <div class="text-center">
      <h1
        class="
          text-2xl font-bold text-white
          sm:text-3xl
        "
      >
        {{ $t('home.create.title') }}
      </h1>
      <p class="mt-2 text-sm text-neutral-400">
        {{ $t('home.create.subtitle') }}
      </p>
    </div>

    <Alert
      v-if="!loggedIn" class="mt-6 border-white/15 bg-white/3 text-neutral-200"
    >
      <AlertCircle aria-hidden="true" class="size-4 text-[#CDF463]" />
      <AlertTitle class="text-neutral-100">
        {{ $t('home.create.login_required') }}
      </AlertTitle>
      <AlertDescription class="mt-2">
        <Button
          as-child size="sm" class="
            bg-[#CDF463] font-semibold text-black
            hover:bg-[#CDF463]/90
          "
        >
          <NuxtLink to="/dashboard/login">
            {{ $t('home.create.login_button') }}
          </NuxtLink>
        </Button>
      </AlertDescription>
    </Alert>

    <form class="mt-6 space-y-4" :aria-busy="status === 'submitting'" @submit.prevent="handleSubmit">
      <FieldGroup>
        <Field>
          <FieldLabel for="home-create-url" class="sr-only">
            {{ $t('home.create.url_label') }}
          </FieldLabel>
          <div
            class="
              flex flex-col gap-3
              sm:flex-row
            "
          >
            <Input
              id="home-create-url"
              ref="urlInput"
              v-model="longUrl"
              type="text"
              inputmode="url"
              autocomplete="off"
              autocapitalize="none"
              spellcheck="false"
              :placeholder="$t('home.create.url_placeholder')"
              :aria-invalid="status === 'error'"
              :disabled="status === 'submitting' || !loggedIn"
              class="
                h-12 flex-1 border-white/15 bg-black/40 text-base text-white
                placeholder:text-neutral-500
                focus-visible:border-[#CDF463]/60 focus-visible:ring-[#CDF463]
              "
            />
            <Button
              type="submit"
              :disabled="status === 'submitting' || !loggedIn"
              :aria-busy="status === 'submitting'"
              class="
                h-12 w-full bg-[#CDF463] font-semibold text-black
                hover:bg-[#CDF463]/90
                sm:w-auto
              "
            >
              <Loader2
                v-if="status === 'submitting'" aria-hidden="true"
                class="motion-safe:animate-spin"
              />
              {{ $t(status === 'submitting' ? 'home.create.generating' : 'home.create.generate') }}
            </Button>
          </div>
        </Field>
      </FieldGroup>

      <Collapsible v-model:open="advancedOpen">
        <CollapsibleTrigger as-child>
          <button
            type="button"
            class="
              flex items-center gap-1 text-sm text-neutral-400 transition-colors
              hover:text-white
            "
            :aria-expanded="advancedOpen"
          >
            {{ $t('home.create.advanced') }}
            <ChevronDown
              aria-hidden="true"
              class="size-4 transition-transform"
              :class="advancedOpen ? 'rotate-180' : ''"
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent class="pt-4">
          <FieldGroup>
            <Field>
              <FieldLabel for="home-create-slug" class="text-neutral-300">
                {{ $t('home.create.slug_label') }}
              </FieldLabel>
              <div class="flex gap-3">
                <Input
                  id="home-create-slug"
                  ref="slugInput"
                  v-model="slug"
                  type="text"
                  autocomplete="off"
                  autocapitalize="none"
                  spellcheck="false"
                  :placeholder="$t('home.create.slug_placeholder')"
                  :disabled="status === 'submitting' || !loggedIn"
                  class="
                    h-11 flex-1 border-white/15 bg-black/40 text-white
                    placeholder:text-neutral-500
                    focus-visible:border-[#CDF463]/60
                    focus-visible:ring-[#CDF463]
                  "
                />
                <Button
                  type="button"
                  variant="outline"
                  :disabled="status === 'submitting' || !loggedIn"
                  class="
                    h-11 shrink-0 border-white/15 bg-transparent
                    text-neutral-200
                    hover:bg-white/10 hover:text-white
                  "
                  @click="randomizeSlug"
                >
                  <Shuffle aria-hidden="true" class="size-4" />
                  {{ $t('home.create.random_slug') }}
                </Button>
              </div>
              <p class="mt-2 text-xs text-neutral-500">
                {{ $t('home.create.slug_hint') }}
              </p>
            </Field>
          </FieldGroup>
        </CollapsibleContent>
      </Collapsible>

      <Alert v-if="status === 'error' && errorMessage" variant="destructive" role="alert">
        <AlertCircle aria-hidden="true" class="size-4" />
        <AlertTitle>{{ errorMessage }}</AlertTitle>
      </Alert>
    </form>

    <div
      v-if="status === 'success' && shortLink"
      class="mt-6 rounded-xl border border-[#CDF463]/30 bg-black/40 p-4"
    >
      <p class="text-xs font-medium tracking-wide text-neutral-400 uppercase">
        {{ $t('home.create.result_title') }}
      </p>
      <div
        class="
          mt-3 flex flex-col gap-3
          sm:flex-row sm:items-center
        "
      >
        <a
          :href="shortLink"
          target="_blank"
          rel="noopener noreferrer"
          class="
            min-w-0 flex-1 font-mono text-base break-all text-[#CDF463]
            hover:underline
          "
        >{{ shortLink }}</a>
        <div class="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            class="
              border-[#CDF463]/40 text-[#CDF463]
              hover:bg-[#CDF463]/10 hover:text-[#CDF463]
            "
            @click="copy(shortLink)"
          >
            <Check v-if="copied" aria-hidden="true" class="size-4" />
            <Copy v-else aria-hidden="true" class="size-4" />
            {{ $t(copied ? 'home.create.copied' : 'home.create.copy') }}
          </Button>
          <Button
            type="button"
            variant="ghost"
            class="
              text-neutral-300
              hover:bg-white/10 hover:text-white
            "
            @click="resetForm"
          >
            {{ $t('home.create.create_another') }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
