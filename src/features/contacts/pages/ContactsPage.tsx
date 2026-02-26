import { ContactsNavSidebar } from "../components/ContactsNavSidebar"
import { ContactsListPanel } from "../components/ContactsListPanel"
import { ContactDetailPanel } from "../components/ContactDetailPanel"
import { useContactsStore } from "../store/contacts.store"

export function ContactsPage() {
    const selectedContactId = useContactsStore((s) => s.selectedContactId)

    return (
        <div style={{
            display: "flex",
            height: "100%",
            overflow: "hidden",
        }}>
            {/* Panel 1 — Nav sidebar */}
            <ContactsNavSidebar />

            {/* Panel 2 — Contacts list/table */}
            <ContactsListPanel />

            {/* Panel 3 — Contact detail (only when selected) */}
            {selectedContactId && <ContactDetailPanel />}
        </div>
    )
}
