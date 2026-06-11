<script lang="ts">
	interface CustomerLike {
		name?: string | null;
		email?: string | null;
		phone?: string | null;
		addressLine1?: string | null;
		addressLine2?: string | null;
		city?: string | null;
		region?: string | null;
		postalCode?: string | null;
		propertyNotes?: string | null;
		animalNotes?: string | null;
	}

	let { customer = {} }: { customer?: CustomerLike } = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2">
	<div class="sm:col-span-2">
		<label for="c-name" class="field-label">Name</label>
		<input id="c-name" name="name" type="text" required value={customer.name ?? ''} class="field" />
	</div>
	<div>
		<label for="c-phone" class="field-label">Phone</label>
		<input id="c-phone" name="phone" type="tel" value={customer.phone ?? ''} class="field" />
	</div>
	<div>
		<label for="c-email" class="field-label">Email</label>
		<input id="c-email" name="email" type="email" value={customer.email ?? ''} class="field" />
	</div>
	<div class="sm:col-span-2">
		<label for="c-address1" class="field-label">Street address</label>
		<input
			id="c-address1"
			name="addressLine1"
			type="text"
			value={customer.addressLine1 ?? ''}
			class="field"
		/>
	</div>
	<div class="sm:col-span-2">
		<label for="c-address2" class="field-label">Unit / line 2</label>
		<input
			id="c-address2"
			name="addressLine2"
			type="text"
			value={customer.addressLine2 ?? ''}
			class="field"
		/>
	</div>
	<div>
		<label for="c-city" class="field-label">City</label>
		<input id="c-city" name="city" type="text" value={customer.city ?? ''} class="field" />
	</div>
	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="c-region" class="field-label">Prov/State</label>
			<input id="c-region" name="region" type="text" value={customer.region ?? ''} class="field" />
		</div>
		<div>
			<label for="c-postal" class="field-label">Postal</label>
			<input
				id="c-postal"
				name="postalCode"
				type="text"
				value={customer.postalCode ?? ''}
				class="field"
			/>
		</div>
	</div>
	<div class="sm:col-span-2">
		<label for="c-animals" class="field-label">
			Animals on property <span class="text-brand-600">(field staff see this first)</span>
		</label>
		<input
			id="c-animals"
			name="animalNotes"
			type="text"
			placeholder="e.g. Two dogs in the backyard — friendly but loud"
			value={customer.animalNotes ?? ''}
			class="field border-brand-300"
		/>
	</div>
	<div class="sm:col-span-2">
		<label for="c-notes" class="field-label">Property notes</label>
		<textarea id="c-notes" name="propertyNotes" rows="2" class="field"
			>{customer.propertyNotes ?? ''}</textarea
		>
	</div>
</div>
