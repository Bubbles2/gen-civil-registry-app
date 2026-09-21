SELECT ct.code, ct.label, ct.labelx as value, row_number() OVER (ORDER BY ct.label) as value_order
	FROM digitech.city ct
	INNER JOIN digitech.country cnt on cnt.cnt_id = ct.cnt_id
WHERE cnt.code = 'SN' AND ct.status = 0 AND ct.label <> 'Azerty'
	ORDER BY ct.label;