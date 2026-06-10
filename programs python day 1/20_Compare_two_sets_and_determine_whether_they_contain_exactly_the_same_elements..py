print("elements in set 1")
set1=eval(input())
print()
print("elements in set 2")
print()
set2=eval(input())
print()
if(len(set1.intersection(set2))==len(set1) and len(set1.intersection(set2))==len(set2)):
    print("the set1 and 2 have same elements")
else:
    print("the set1 and 2 does'nt have same elements")