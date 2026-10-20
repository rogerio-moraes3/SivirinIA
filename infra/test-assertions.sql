-- Test-only assertion helpers. SECURITY INVOKER preserves the role under test.
create temporary table test_assertions(description text not null);
grant insert,select on pg_temp.test_assertions to anon,authenticated;
create function pg_temp.assert_true(value boolean, description text) returns text language plpgsql as $$
begin
 if value is distinct from true then raise exception 'Assertion failed: %',description; end if;
 insert into pg_temp.test_assertions values(description);return 'ok';
end $$;
create function pg_temp.assert_eq(actual anycompatible, expected anycompatible, description text) returns text language plpgsql as $$
begin
 return pg_temp.assert_true(actual is not distinct from expected,description);
end $$;
create function pg_temp.assert_ne(actual anycompatible, expected anycompatible, description text) returns text language plpgsql as $$
begin
 return pg_temp.assert_true(actual is distinct from expected,description);
end $$;
create function pg_temp.assert_alike(actual text, expected text, description text) returns text language plpgsql as $$
begin
 return pg_temp.assert_true(actual like expected,description);
end $$;
create function pg_temp.assert_throws(statement text, expected_state text, expected_message text, description text) returns text language plpgsql as $$
declare actual_state text; actual_message text; caught boolean:=false;
begin
 begin execute statement;
 exception when others then caught:=true;get stacked diagnostics actual_state=returned_sqlstate,actual_message=message_text;
 end;
 if not caught or actual_state is distinct from expected_state or (expected_message is not null and actual_message is distinct from expected_message) then
 raise exception 'Assertion failed: % (expected SQLSTATE %, received %, message %)',description,expected_state,coalesce(actual_state,'no exception'),coalesce(actual_message,'none');
 end if;
 insert into pg_temp.test_assertions values(description);return 'ok';
end $$;
create function pg_temp.assert_lives(statement text, description text) returns text language plpgsql as $$
begin
 begin execute statement;exception when others then raise exception 'Assertion failed: % (SQLSTATE %: %)',description,sqlstate,sqlerrm;end;
 insert into pg_temp.test_assertions values(description);return 'ok';
end $$;
