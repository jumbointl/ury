import re
import frappe


def _numero(nombre):
    """Los últimos 5 dígitos del número de la factura, ignorando el sufijo de enmienda (-1, -2…).
    None cuando el nombre no termina en dígitos (series raras, devoluciones nombradas aparte)."""
    m = re.search(r"(\d+)(?:-\d+)*$", nombre or "")
    return int(m.group(1)[-5:]) if m else None


def set_order_number(doc, event):
    if doc.flags.de_sync or doc.get("is_return"):
        return  # una devolución no es un pedido nuevo: no lleva número de orden
    pos_profile = doc.pos_profile
    if doc.order_type == "Aggregators":
        last_invoice = frappe.get_value(
            "POS Opening Entry",
            {"pos_profile": pos_profile, "status": "Open"},
            "custom_ury_last_aggregator_invoice",
        )
    else:
        last_invoice = frappe.get_value(
            "POS Opening Entry",
            {"pos_profile": pos_profile, "status": "Open"},
            "custom_ury_last_invoice",
        )
    last_invoice_number = _numero(last_invoice) if last_invoice else None
    current_invoice_number = _numero(doc.name)
    if last_invoice_number is not None and current_invoice_number is not None:

        order_number = current_invoice_number - last_invoice_number
        if order_number > 0:
            if doc.order_type == "Aggregators":
                order_number = "AGR - " + str(order_number)
            frappe.db.set_value(
                "POS Invoice",
                doc.name,
                "custom_ury_order_number",
                order_number,
                update_modified=False,
            )
        else:
            frappe.db.set_value(
                "POS Invoice",
                doc.name,
                "custom_ury_order_number",
                current_invoice_number,
                update_modified=False,
            )
    else:
        pos_open_name = frappe.get_value(
            "POS Opening Entry",
            {"pos_profile": pos_profile, "status": "Open"},
            "name",
        )

        # invoice = frappe.get_last_doc(
        #     "POS Invoice", filters={"pos_profile": doc.pos_profile}
        # )

        if doc.order_type == "Aggregators":
            aggregator_invoice =frappe.get_last_doc(
                "POS Invoice", filters={"pos_profile": doc.pos_profile,"order_type": "Aggregators"}
            )
            aggregator_invoice_number = int(aggregator_invoice.name[-5:])
            aggregator_last_order_number = aggregator_invoice_number - 1
            frappe.db.set_value(
                "POS Opening Entry", pos_open_name, "custom_ury_last_aggregator_invoice", aggregator_last_order_number
            )
        else:
            invoice = frappe.get_last_doc(
                "POS Invoice", filters={"pos_profile": doc.pos_profile,"order_type": ["!=", "Aggregators"]}
            )

            invoice_number = int(invoice.name[-5:])
            last_order_number = invoice_number - 1

            frappe.db.set_value(
                "POS Opening Entry", pos_open_name, "custom_ury_last_invoice", last_order_number
            )
        
        default_value = "AGR - 1" if doc.order_type == "Aggregators" else "1"
        frappe.db.set_value(
            "POS Invoice",
            doc.name,
            "custom_ury_order_number",
            default_value,
            update_modified=False,  
        )


def set_last_invoice_in_pos_open(doc, event):
    if doc.flags.de_sync:
        return
    try:
        invoice = frappe.get_last_doc(
            "POS Invoice", filters={"pos_profile": doc.pos_profile,"order_type": ["!=", "Aggregators"]}
        )
        doc.custom_ury_last_invoice = invoice.name
    except:
        pass 
    try:
        aggregator_invoice =frappe.get_last_doc(
            "POS Invoice", filters={"pos_profile": doc.pos_profile,"order_type": "Aggregators"}
        )
        doc.custom_ury_last_aggregator_invoice = aggregator_invoice.name
    except:
        pass